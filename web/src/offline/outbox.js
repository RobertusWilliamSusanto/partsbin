import { getAll, putItem, deleteItem } from './db';

const MAX_OUTBOX_OPS = 200;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const VALID_CATEGORIES = ['MCU', 'Sensor', 'Passive', 'Power', 'Actuator', 'Connector', 'Display'];
const VALID_STATUSES = ['planned', 'in_progress', 'done'];

// Membuat pengenal acak unik untuk operasi antrean
function generateOpId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Validasi ketat payload mutasi di sisi klien sebelum masuk antrean (server tetap otoritas)
function validatePayload(entityType, method, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload mutasi harus berupa objek data yang valid.');
  }
  if (entityType === 'component') {
    if (method === 'POST' || method === 'PUT') {
      if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
        throw new Error('Nama komponen wajib diisi.');
      }
      if (!VALID_CATEGORIES.includes(payload.category)) {
        throw new Error(`Kategori tidak valid: ${payload.category}`);
      }
      if (Number(payload.stock) < 0 || Number(payload.min_stock) < 0 || Number(payload.unit_price) < 0) {
        throw new Error('Stok, batas minimum, dan harga satuan tidak boleh bernilai negatif.');
      }
    } else if (method === 'PATCH') {
      if (typeof payload.stock !== 'number' || payload.stock < 0) {
        throw new Error('Nilai stok harus berupa bilangan bulat >= 0.');
      }
    }
  } else if (entityType === 'project') {
    if (method === 'POST' || method === 'PUT') {
      if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
        throw new Error('Nama proyek wajib diisi.');
      }
    } else if (method === 'PATCH') {
      if (!VALID_STATUSES.includes(payload.status)) {
        throw new Error(`Status pengerjaan fisik proyek tidak valid: ${payload.status}`);
      }
    }
  } else if (entityType === 'project_item' && method === 'POST') {
    if (!payload.component_id || Number(payload.quantity_needed) <= 0) {
      throw new Error('Komponen dan jumlah kebutuhan (> 0) wajib diisi.');
    }
  }
}

// Menambahkan operasi mutasi ke outbox dengan aturan coalescing dan batas kapasitas
export async function enqueueOp({ endpoint, method, entityType, entityId, payload, tempId = null }) {
  validatePayload(entityType, method, payload);
  const allOps = await getAll('outbox');

  // Coalescing: jika menghapus entitas sementara yang belum tersinkron, hapus dari outbox
  if (method === 'DELETE' && (String(entityId).startsWith('tmp_') || tempId)) {
    const targetId = entityId || tempId;
    for (const op of allOps) {
      if (op.entityId === targetId || op.tempId === targetId || op.payload?.component_id === targetId) {
        await deleteItem('outbox', op.id);
      }
    }
    return null;
  }

  // Coalescing: jika entitas adalah data sementara (tmp_*), gabungkan langsung ke op create (POST)
  const isTempEntity = String(entityId).startsWith('tmp_') || tempId;
  if (isTempEntity && (method === 'PATCH' || method === 'PUT')) {
    const targetTempId = entityId || tempId;
    const createOp = allOps.find(
      (op) => (op.entityId === targetTempId || op.tempId === targetTempId) && op.method === 'POST' && op.status === 'pending'
    );
    if (createOp) {
      createOp.payload = { ...createOp.payload, ...payload };
      createOp.clientTimestamp = new Date().toISOString();
      await putItem('outbox', createOp);
      return createOp;
    }
  }

  // Coalescing: jika PATCH stock berulang untuk komponen yang sama, perbarui op sebelumnya
  if (entityType === 'component' && method === 'PATCH') {
    const existingPatch = allOps.find(
      (op) => op.entityType === 'component' && op.entityId === entityId && op.method === 'PATCH' && op.status === 'pending'
    );
    if (existingPatch) {
      existingPatch.payload = { ...existingPatch.payload, ...payload };
      existingPatch.clientTimestamp = new Date().toISOString();
      await putItem('outbox', existingPatch);
      return existingPatch;
    }
  }

  // Coalescing: jika PATCH status berulang untuk proyek yang sama, perbarui op sebelumnya
  if (entityType === 'project' && method === 'PATCH') {
    const existingPatch = allOps.find(
      (op) => op.entityType === 'project' && op.entityId === entityId && op.method === 'PATCH' && op.status === 'pending'
    );
    if (existingPatch) {
      existingPatch.payload = { ...existingPatch.payload, ...payload };
      existingPatch.clientTimestamp = new Date().toISOString();
      await putItem('outbox', existingPatch);
      return existingPatch;
    }
  }

  // Coalescing: jika PUT berulang untuk entitas yang sama, gabungkan ke op sebelumnya
  if (method === 'PUT') {
    const existingPut = allOps.find(
      (op) => op.entityType === entityType && op.entityId === entityId && op.method === 'PUT' && op.status === 'pending'
    );
    if (existingPut) {
      existingPut.payload = { ...existingPut.payload, ...payload };
      existingPut.clientTimestamp = new Date().toISOString();
      await putItem('outbox', existingPut);
      return existingPut;
    }
  }

  // Batasi kapasitas antrean outbox maksimal 200 operasi demi keamanan memori
  if (allOps.length >= MAX_OUTBOX_OPS) {
    throw new Error('Antrean offline mencapai batas maksimal 200. Sambungkan internet untuk sinkronisasi.');
  }

  const newOp = {
    id: generateOpId(),
    endpoint,
    method,
    entityType,
    entityId,
    payload,
    tempId,
    clientTimestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
  };

  await putItem('outbox', newOp);
  return newOp;
}

// Mengambil seluruh operasi yang siap dieksekusi secara FIFO (pertama masuk, pertama keluar)
export async function getPendingOps() {
  const allOps = await getAll('outbox');
  const now = Date.now();

  return allOps
    .map((op) => {
      // Tandai operasi berumur lebih dari 30 hari sebagai kedaluwarsa
      const age = now - new Date(op.createdAt).getTime();
      return age > THIRTY_DAYS_MS ? { ...op, isExpired: true } : op;
    })
    .filter((op) => op.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Mengubah status operasi (misal: 'failed', 'syncing', 'pending')
export async function updateOpStatus(opId, status, lastError = null) {
  const allOps = await getAll('outbox');
  const op = allOps.find((o) => o.id === opId);
  if (!op) return;
  op.status = status;
  if (lastError !== null) op.lastError = lastError;
  if (status === 'failed') op.retryCount = (op.retryCount || 0) + 1;
  await putItem('outbox', op);
}

// Menghapus operasi dari antrean setelah sukses disinkronkan ke server
export async function removeOp(opId) {
  await deleteItem('outbox', opId);
}

// Mengembalikan operasi gagal ke status 'pending' agar dicoba kembali
export async function retryOp(opId) {
  const allOps = await getAll('outbox');
  const op = allOps.find((o) => o.id === opId);
  if (!op) return;
  op.status = 'pending';
  op.retryCount = 0;
  op.lastError = null;
  await putItem('outbox', op);
}

// Memeriksa apakah entitas tertentu memiliki operasi yang masih tertunda di outbox
export async function hasPendingOpsForEntity(entityId) {
  if (!entityId) return false;
  const allOps = await getAll('outbox');
  return allOps.some((op) => (op.entityId === entityId || op.tempId === entityId) && op.status === 'pending');
}
