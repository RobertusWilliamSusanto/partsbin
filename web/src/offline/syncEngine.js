import { getAll, getItem, putItem, deleteItem } from './db';
import { getPendingOps, removeOp, updateOpStatus } from './outbox';
import { apiClient } from '../config/api';

const BACKOFF_DELAYS = [3000, 10000, 30000, 60000];
let isFlushingInMemory = false;
let backoffIndex = 0;
let backoffTimeoutId = null;
let syncIntervalId = null;
let customSender = null;

// Saluran siaran multi-tab bawaan browser untuk menyelaraskan perubahan data
const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('partsbin_sync_channel')
    : null;

// Mengirimkan sinyal notifikasi perubahan data ke tab browser lainnya
export function broadcastSyncEvent(eventType, payload = {}) {
  try {
    syncChannel?.postMessage({ type: eventType, payload, timestamp: Date.now() });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('partsbin:sync-event', { detail: { type: eventType, payload } }));
    }
  } catch {
    // Abaikan jika kanal broadcast gagal
  }
}

// Mengizinkan injeksi fungsi pengirim buatan untuk pengujian logika tanpa menyentuh API nyata
export function setCustomSender(fn) {
  customSender = fn;
}

// Fungsi pengirim bawaan yang menggunakan Axios apiClient
async function defaultSend(op) {
  try {
    let res;
    const url = op.endpoint;
    if (op.method === 'GET') res = await apiClient.get(url);
    else if (op.method === 'POST') res = await apiClient.post(url, op.payload);
    else if (op.method === 'PUT') res = await apiClient.put(url, op.payload);
    else if (op.method === 'PATCH') res = await apiClient.patch(url, op.payload);
    else if (op.method === 'DELETE') res = await apiClient.delete(url);
    return { ok: true, status: 200, data: res?.data ?? res };
  } catch (err) {
    const status = err?.status || null;
    const isNetworkOr5xx = !status || status >= 500 || status === 429;
    return {
      ok: false,
      status,
      isNetworkOr5xx,
      message: err?.message || 'Gagal mengirim permintaan ke server.',
    };
  }
}

// Memperbarui ID sementara (tmp_*) dengan ID riil dari server pada outbox dan basis data lokal
async function applyTempIdMapping(tempId, realId, entityType) {
  if (!tempId || !realId) return;
  await putItem('idmap', { tempId, realId, entityType, createdAt: new Date().toISOString() });

  // Perbarui entitas di store lokal (pindahkan dari tmpId ke realId)
  const storeName = entityType === 'project' ? 'projects' : 'components';
  const existingLocal = await getItem(storeName, tempId);
  if (existingLocal) {
    await deleteItem(storeName, tempId);
    await putItem(storeName, { ...existingLocal, id: realId });
  }

  // Tulis ulang op antrean yang merujuk pada tempId tersebut
  const allOps = await getAll('outbox');
  for (const op of allOps) {
    let modified = false;
    if (op.entityId === tempId) {
      op.entityId = realId;
      op.endpoint = op.endpoint.replace(tempId, realId);
      modified = true;
    }
    if (op.payload?.component_id === tempId) {
      op.payload.component_id = realId;
      modified = true;
    }
    if (op.payload?.items && Array.isArray(op.payload.items)) {
      op.payload.items = op.payload.items.map((it) =>
        it.component_id === tempId ? { ...it, component_id: realId } : it
      );
      modified = true;
    }
    if (modified) {
      await putItem('outbox', op);
    }
  }
}

// Menjalankan flush antrean operasi secara berurutan (FIFO)
export async function flushOutbox() {
  if (isFlushingInMemory) return { status: 'busy' };

  const executeFlush = async () => {
    isFlushingInMemory = true;
    try {
      const ops = await getPendingOps();
      for (const op of ops) {
        // Tahan operasi proyek yang masih merujuk component_id sementara yang belum tersinkron
        if (op.payload?.component_id?.startsWith?.('tmp_')) {
          continue;
        }

        const sender = customSender || defaultSend;
        const result = await sender(op);

        if (result.ok) {
          // Sukses 2xx: hapus op dari outbox dan simpan hasil server ke penyimpanan lokal
          if (op.tempId && result.data?.id) {
            await applyTempIdMapping(op.tempId, result.data.id, op.entityType);
          }
          if (op.entityType === 'component' && result.data) {
            await putItem('components', result.data);
          } else if (op.entityType === 'project' && result.data) {
            await putItem('projects', result.data);
          }
          await removeOp(op.id);
          backoffIndex = 0; // Reset backoff jika operasi berhasil
          broadcastSyncEvent('op_synced', { opId: op.id, entityType: op.entityType });
        } else if (result.isNetworkOr5xx) {
          // Kendala jaringan atau server (5xx/429): jadwalkan backoff berjenjang dan hentikan loop ini
          const delay = BACKOFF_DELAYS[Math.min(backoffIndex, BACKOFF_DELAYS.length - 1)];
          backoffIndex += 1;
          if (backoffTimeoutId) clearTimeout(backoffTimeoutId);
          backoffTimeoutId = setTimeout(() => flushOutbox(), delay);
          broadcastSyncEvent('sync_backoff', { delay, retryIn: backoffIndex });
          break;
        } else {
          // Error 4xx permanen: tandai op sebagai failed, tidak memblokir op lain yang independen
          await updateOpStatus(op.id, 'failed', result.message);
          broadcastSyncEvent('op_failed', { opId: op.id, message: result.message });
        }
      }
    } finally {
      isFlushingInMemory = false;
      broadcastSyncEvent('sync_completed');
    }
  };

  // Gunakan Web Locks API bawaan bila tersedia untuk mencegah duplikasi eksekusi multi-tab
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('partsbin_sync_engine_lock', { ifAvailable: true }, async (lock) => {
      if (!lock) return { status: 'locked' };
      return executeFlush();
    });
  }

  return executeFlush();
}

// Inisialisasi pendengar event otomatis untuk memicu sinkronisasi dari halaman
export function initSyncEngineListeners() {
  if (typeof window === 'undefined') return;

  // Pemicu 1: Saat koneksi internet kembali tersambung (event 'online')
  window.addEventListener('online', () => flushOutbox());

  // Pemicu 2: Saat tab kembali aktif dan terlihat oleh pengguna
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flushOutbox();
  });

  // Pemicu 3: Interval berkala setiap 30 detik untuk memeriksa antrean
  if (!syncIntervalId) {
    syncIntervalId = setInterval(async () => {
      const ops = await getPendingOps();
      if (ops.length > 0) flushOutbox();
    }, 30000);
  }

  // Pemicu 4: Dengarkan kanal siaran tab lain
  syncChannel?.addEventListener('message', (event) => {
    if (event.data?.type === 'trigger_flush') flushOutbox();
  });

  // Flush perdana saat aplikasi mulai
  flushOutbox();
}
