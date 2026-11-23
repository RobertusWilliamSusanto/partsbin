import { apiClient } from '../config/api';
import { withTimeout } from '../utils/safeOffline';

// Deteksi apakah kesalahan terjadi akibat putusnya koneksi jaringan atau mode offline
function isNetworkError(err) {
  return typeof navigator !== 'undefined' && !navigator.onLine
    ? true
    : !err?.status || err.status === 0;
}

// Service singleton komponen dengan dukungan offline-first (IndexedDB + Outbox)
class ComponentService {
  async getAll() {
    let res;
    try {
      res = await apiClient.get('/components');
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          const list = await withTimeout(import('../offline/db').then((m) => m.getAll('components')));
          return { data: list };
        } catch {
          // Teruskan error jaringan asli bila pembacaan cadangan offline gagal
          throw err;
        }
      }
      throw err;
    }

    const list = Array.isArray(res?.data) ? res.data : [];
    try {
      const merged = await withTimeout(import('../offline/offlineService').then((m) => m.overlayComponents(list)));
      return { ...res, data: merged };
    } catch (offlineErr) {
      // Jalur fail-open: kembalikan data API langsung bila overlay offline gagal atau timeout
      console.warn('Fail-open offline components:', offlineErr?.message || offlineErr);
      return res;
    }
  }

  async getById(id) {
    // Guard: jangan pernah mengirim ID sementara (tmp_*) ke API server
    if (String(id).startsWith('tmp_')) {
      try {
        const db = await withTimeout(import('../offline/db'));
        const mapped = await db.getItem('idmap', id);
        if (mapped?.realId) return this.getById(mapped.realId);
        const item = await db.getItem('components', id);
        if (item) return { data: item };
        return Promise.reject({ status: 404, message: 'Komponen sementara tidak ditemukan di penyimpanan lokal.' });
      } catch (err) {
        return Promise.reject(err?.status ? err : { status: 404, message: err?.message || 'Gagal membaca komponen sementara.' });
      }
    }
    let res;
    try {
      res = await apiClient.get(`/components/${id}`);
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          const item = await withTimeout(import('../offline/db').then((m) => m.getItem('components', id)));
          if (item) return { data: item };
        } catch {
          // Bila offline gagal, teruskan error jaringan asli
          throw err;
        }
      }
      throw err;
    }

    if (res?.data) {
      import('../offline/db').then((m) => m.putItem('components', res.data)).catch(() => {});
    }
    return res;
  }

  async create(data) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { offlineCreateComponent } = await import('../offline/offlineService');
      return offlineCreateComponent(data);
    }
    try {
      const res = await apiClient.post('/components', data);
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('components', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineCreateComponent } = await import('../offline/offlineService');
        return offlineCreateComponent(data);
      }
      throw err;
    }
  }

  async update(id, data) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineUpdateComponent } = await import('../offline/offlineService');
      return offlineUpdateComponent(id, data);
    }
    try {
      const res = await apiClient.put(`/components/${id}`, data);
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('components', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineUpdateComponent } = await import('../offline/offlineService');
        return offlineUpdateComponent(id, data);
      }
      throw err;
    }
  }

  async updateStock(id, stock) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineUpdateStock } = await import('../offline/offlineService');
      return offlineUpdateStock(id, stock);
    }
    try {
      const res = await apiClient.patch(`/components/${id}/stock`, { stock });
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('components', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineUpdateStock } = await import('../offline/offlineService');
        return offlineUpdateStock(id, stock);
      }
      throw err;
    }
  }

  async remove(id) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineDeleteComponent } = await import('../offline/offlineService');
      return offlineDeleteComponent(id);
    }
    try {
      const res = await apiClient.delete(`/components/${id}`);
      const { deleteItem } = await import('../offline/db');
      await deleteItem('components', id);
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineDeleteComponent } = await import('../offline/offlineService');
        return offlineDeleteComponent(id);
      }
      throw err;
    }
  }
}

export default new ComponentService();
