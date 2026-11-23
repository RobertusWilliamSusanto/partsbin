import { apiClient } from '../config/api';

// Deteksi apakah kesalahan terjadi akibat putusnya koneksi jaringan atau mode offline
function isNetworkError(err) {
  return typeof navigator !== 'undefined' && !navigator.onLine
    ? true
    : !err?.status || err.status === 0;
}

// Service singleton komponen dengan dukungan offline-first (IndexedDB + Outbox)
class ComponentService {
  async getAll() {
    try {
      const res = await apiClient.get('/components');
      const list = Array.isArray(res?.data) ? res.data : [];
      // Terapkan overlay perubahan lokal tertunda tanpa memblokir bundle awal lewat import dinamis
      const { overlayComponents } = await import('../offline/offlineService');
      const merged = await overlayComponents(list);
      return { ...res, data: merged };
    } catch (err) {
      if (isNetworkError(err)) {
        const { getAll } = await import('../offline/db');
        const list = await getAll('components');
        return { data: list };
      }
      throw err;
    }
  }

  async getById(id) {
    try {
      const res = await apiClient.get(`/components/${id}`);
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('components', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { getItem } = await import('../offline/db');
        const item = await getItem('components', id);
        if (item) return { data: item };
      }
      throw err;
    }
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
