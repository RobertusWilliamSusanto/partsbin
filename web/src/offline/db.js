// Pembungkus IndexedDB native murni tanpa library eksternal demi kepatuhan daftar putih
const DB_NAME = 'partsbin_db';
const DB_VERSION = 1;

let dbInstance = null;
let dbOpenPromise = null;

// Cek ketersediaan IndexedDB di lingkungan browser saat ini
export function isIDBAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

// Membuka database secara singleton agar tidak membuka koneksi berulang kali
export function openDB() {
  if (!isIDBAvailable()) {
    return Promise.reject(new Error('IndexedDB tidak didukung pada lingkungan browser ini.'));
  }
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Store untuk salinan data komponen lokal
      if (!db.objectStoreNames.contains('components')) {
        db.createObjectStore('components', { keyPath: 'id' });
      }
      // Store untuk salinan data proyek lokal beserta BOM
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      // Store untuk antrean mutasi offline (outbox)
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
      // Store untuk pemetaan ID sementara ke ID nyata dari server
      if (!db.objectStoreNames.contains('idmap')) {
        db.createObjectStore('idmap', { keyPath: 'tempId' });
      }
      // Store biner untuk berkas gambar sampul terkompresi
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs', { keyPath: 'id' });
      }
      // Store metadata aplikasi (penanda sinkronisasi, stempel waktu, dll)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
        dbOpenPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      dbOpenPromise = null;
      reject(event.target.error || new Error('Gagal membuka database IndexedDB.'));
    };

    request.onblocked = () => {
      dbOpenPromise = null;
      reject(new Error('Koneksi IndexedDB diblokir oleh tab lain.'));
    };
  });

  return dbOpenPromise;
}

// Mengambil satu rekaman berdasarkan primary key
export async function getItem(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

// Mengambil seluruh rekaman dari suatu object store
export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

// Menyimpan atau memperbarui satu rekaman dengan penanganan kuota penyimpanan
export async function putItem(storeName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => {
      // Deteksi QuotaExceededError agar tidak merusak alur aplikasi
      if (req.error && req.error.name === 'QuotaExceededError') {
        reject(new Error('Kapasitas penyimpanan lokal perangkat penuh (QuotaExceededError).'));
      } else {
        reject(req.error || e);
      }
    };
  });
}

// Menghapus satu rekaman berdasarkan primary key
export async function deleteItem(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// Mengosongkan seluruh isi rekaman dari suatu store
export async function clearStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
