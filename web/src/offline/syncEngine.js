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
    let processedCount = 0;
    try {
      const ops = await getPendingOps();
      for (const op of ops) {
        // Tahan operasi proyek yang masih merujuk component_id sementara yang belum tersinkron
        const hasTempRef =
          op.payload?.component_id?.startsWith?.('tmp_') ||
          op.payload?.items?.some?.((it) => it.component_id?.startsWith?.('tmp_'));
        if (hasTempRef || (op.entityId?.startsWith?.('tmp_') && op.method !== 'POST')) {
          continue;
        }

        // Tahan operasi kedaluwarsa (> 30 hari) hingga dikonfirmasi oleh pengguna
        if (op.isExpired && !op.userConfirmed) {
          continue;
        }

        op.attempts = (op.attempts || 0) + 1;
        await putItem('outbox', op);

        const sender = customSender || defaultSend;
        let result = null;

        // Dedup POST ambigu: periksa ke server via GET sebelum mencoba ulang pembuatan entitas
        if ((op.attempts > 1 || op.retryCount > 0) && op.method === 'POST') {
          try {
            const checkUrl = op.entityType === 'component' ? '/components' : '/projects';
            const serverCheck = await sender({ method: 'GET', endpoint: checkUrl });
            const list = Array.isArray(serverCheck?.data) ? serverCheck.data : [];
            const duplicate = list.find((it) => it.name === op.payload?.name);
            if (duplicate) {
              result = { ok: true, status: 200, data: duplicate };
            }
          } catch {
            // Abaikan kesalahan verifikasi server dan lanjutkan ke pengiriman
          }
        }

        if (!result) {
          result = await sender(op);
        }

        // Idempotensi retry: DELETE 404 pada percobaan ulang dianggap sukses karena data telah terhapus
        if (!result.ok && result.status === 404 && op.method === 'DELETE' && (op.attempts > 1 || op.retryCount > 0)) {
          result = { ok: true, status: 200, data: null };
        }

        // Idempotensi retry: POST item 409 pada percobaan ulang dianggap sukses jika item telah tercatat di server
        if (!result.ok && result.status === 409 && op.entityType === 'project_item' && (op.attempts > 1 || op.retryCount > 0)) {
          try {
            const projCheck = await sender({ method: 'GET', endpoint: `/projects/${op.entityId}` });
            const items = projCheck?.data?.items || [];
            const existing = items.find((it) => it.component_id === op.payload?.component_id);
            if (existing) {
              result = { ok: true, status: 200, data: existing };
            }
          } catch {
            // Abaikan kegagalan verifikasi
          }
        }

        if (result.ok) {
          // Sukses 2xx: hapus op dari outbox dan simpan hasil server ke penyimpanan lokal
          if (op.tempId && result.data?.id) {
            await applyTempIdMapping(op.tempId, result.data.id, op.entityType);
          }
          if (op.entityType === 'component' && result.data) {
            // Berikan penanda waktu sinkronisasi untuk melindungi data lokal dari balapan respons cache basi
            await putItem('components', { ...result.data, syncedAt: Date.now() });
          } else if (op.entityType === 'project' && result.data) {
            await putItem('projects', { ...result.data, syncedAt: Date.now() });
            // Unggah berkas blob gambar sampul bila ada yang tersimpan secara offline
            const targetProjId = result.data.id;
            const tempBlobKey = op.tempId ? `blob_${op.tempId}` : null;
            const realBlobKey = `blob_${targetProjId}`;
            const pendingBlob = (tempBlobKey ? await getItem('blobs', tempBlobKey) : null) || (await getItem('blobs', realBlobKey));
            if (pendingBlob?.file) {
              try {
                const formData = new FormData();
                formData.append('image', pendingBlob.file);
                await apiClient.post(`/projects/${targetProjId}/image`, formData, {
                  timeout: 30000,
                  headers: { 'Content-Type': undefined },
                });
                if (tempBlobKey) await deleteItem('blobs', tempBlobKey);
                await deleteItem('blobs', realBlobKey);
              } catch {
                // Biarkan tersimpan untuk percobaan berikutnya bila upload gambar belum berhasil
              }
            }
          }
          await removeOp(op.id);
          backoffIndex = 0; // Reset backoff jika operasi berhasil
          processedCount += 1;
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
          processedCount += 1;
          broadcastSyncEvent('op_failed', { opId: op.id, message: result.message });
        }
      }
    } finally {
      isFlushingInMemory = false;
      // Batasi siaran sinkronisasi selesai hanya jika ada minimal satu operasi yang diproses
      if (processedCount > 0) {
        broadcastSyncEvent('sync_completed');
      }
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
