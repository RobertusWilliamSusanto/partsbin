import { apiClient } from '../config/api';
import { withTimeout } from '../utils/safeOffline';

// Deteksi apakah kesalahan terjadi akibat putusnya koneksi jaringan atau mode offline
function isNetworkError(err) {
  return typeof navigator !== 'undefined' && !navigator.onLine
    ? true
    : !err?.status || err.status === 0;
}

// Service singleton proyek dengan dukungan offline-first (IndexedDB + Outbox)
class ProjectService {
  async getAll() {
    let res;
    try {
      res = await apiClient.get('/projects');
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          const list = await withTimeout(import('../offline/db').then((m) => m.getAll('projects')));
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
      const merged = await withTimeout(import('../offline/offlineService').then((m) => m.overlayProjects(list)));
      return { ...res, data: merged };
    } catch (offlineErr) {
      // Jalur fail-open: kembalikan data API langsung bila overlay offline gagal atau timeout
      console.warn('Fail-open offline projects:', offlineErr?.message || offlineErr);
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
        const item = await db.getItem('projects', id);
        if (item) return { data: item };
        return Promise.reject({ status: 404, message: 'Proyek sementara tidak ditemukan di penyimpanan lokal.' });
      } catch (err) {
        return Promise.reject(err?.status ? err : { status: 404, message: err?.message || 'Gagal membaca proyek sementara.' });
      }
    }
    let res;
    try {
      res = await apiClient.get(`/projects/${id}`);
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          const item = await withTimeout(import('../offline/db').then((m) => m.getItem('projects', id)));
          if (item) return { data: item };
        } catch {
          // Bila offline gagal, teruskan error jaringan asli
          throw err;
        }
      }
      throw err;
    }

    if (res?.data) {
      import('../offline/db').then((m) => m.putItem('projects', res.data)).catch(() => {});
    }
    return res;
  }

  async create(data) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { offlineCreateProject } = await import('../offline/offlineService');
      return offlineCreateProject(data);
    }
    try {
      const res = await apiClient.post('/projects', data);
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('projects', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineCreateProject } = await import('../offline/offlineService');
        return offlineCreateProject(data);
      }
      throw err;
    }
  }

  async update(id, data) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineUpdateProject } = await import('../offline/offlineService');
      return offlineUpdateProject(id, data);
    }
    try {
      const res = await apiClient.put(`/projects/${id}`, data);
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('projects', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineUpdateProject } = await import('../offline/offlineService');
        return offlineUpdateProject(id, data);
      }
      throw err;
    }
  }

  async updateStatus(id, status) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineUpdateProjectStatus } = await import('../offline/offlineService');
      return offlineUpdateProjectStatus(id, status);
    }
    try {
      const res = await apiClient.patch(`/projects/${id}/status`, { status });
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('projects', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineUpdateProjectStatus } = await import('../offline/offlineService');
        return offlineUpdateProjectStatus(id, status);
      }
      throw err;
    }
  }

  async uploadImage(id, file) {
    // Jika proyek masih memakai ID sementara atau sedang offline, simpan blob ke IndexedDB
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineSaveProjectImage } = await import('../offline/offlineService');
      return offlineSaveProjectImage(id, file);
    }

    const formData = new FormData();
    formData.append('image', file);
    try {
      return await apiClient.post(`/projects/${id}/image`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': undefined,
        },
      });
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineSaveProjectImage } = await import('../offline/offlineService');
        return offlineSaveProjectImage(id, file);
      }
      throw err;
    }
  }

  async remove(id) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(id).startsWith('tmp_')) {
      const { offlineDeleteProject } = await import('../offline/offlineService');
      return offlineDeleteProject(id);
    }
    try {
      const res = await apiClient.delete(`/projects/${id}`);
      const { deleteItem } = await import('../offline/db');
      await deleteItem('projects', id);
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineDeleteProject } = await import('../offline/offlineService');
        return offlineDeleteProject(id);
      }
      throw err;
    }
  }

  async addItem(projectId, data) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(projectId).startsWith('tmp_')) {
      const { offlineAddProjectItem } = await import('../offline/offlineService');
      return offlineAddProjectItem(projectId, data);
    }
    try {
      const res = await apiClient.post(`/projects/${projectId}/items`, data);
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineAddProjectItem } = await import('../offline/offlineService');
        return offlineAddProjectItem(projectId, data);
      }
      throw err;
    }
  }

  async removeItem(projectId, itemId) {
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || String(projectId).startsWith('tmp_')) {
      const { offlineRemoveProjectItem } = await import('../offline/offlineService');
      return offlineRemoveProjectItem(projectId, itemId);
    }
    try {
      const res = await apiClient.delete(`/projects/${projectId}/items/${itemId}`);
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { offlineRemoveProjectItem } = await import('../offline/offlineService');
        return offlineRemoveProjectItem(projectId, itemId);
      }
      throw err;
    }
  }
}

export default new ProjectService();
