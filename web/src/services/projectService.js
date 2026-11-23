import { apiClient } from '../config/api';

// Deteksi apakah kesalahan terjadi akibat putusnya koneksi jaringan atau mode offline
function isNetworkError(err) {
  return typeof navigator !== 'undefined' && !navigator.onLine
    ? true
    : !err?.status || err.status === 0;
}

// Service singleton proyek dengan dukungan offline-first (IndexedDB + Outbox)
class ProjectService {
  async getAll() {
    try {
      const res = await apiClient.get('/projects');
      const list = Array.isArray(res?.data) ? res.data : [];
      // Pertahankan proyek offline lokal yang belum tersinkron dengan pola overlay
      const { overlayProjects } = await import('../offline/offlineService');
      const merged = await overlayProjects(list);
      return { ...res, data: merged };
    } catch (err) {
      if (isNetworkError(err)) {
        const { getAll } = await import('../offline/db');
        const list = await getAll('projects');
        return { data: list };
      }
      throw err;
    }
  }

  async getById(id) {
    try {
      const res = await apiClient.get(`/projects/${id}`);
      if (res?.data) {
        const { putItem } = await import('../offline/db');
        await putItem('projects', res.data);
      }
      return res;
    } catch (err) {
      if (isNetworkError(err)) {
        const { getItem } = await import('../offline/db');
        const item = await getItem('projects', id);
        if (item) return { data: item };
      }
      throw err;
    }
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
