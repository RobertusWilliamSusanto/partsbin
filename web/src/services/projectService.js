import { apiClient } from '../config/api';

// Service singleton pemanggil endpoint /projects dan item BOM (/projects/:id/items)
class ProjectService {
  getAll() {
    return apiClient.get('/projects');
  }

  getById(id) {
    return apiClient.get(`/projects/${id}`);
  }

  create(data) {
    return apiClient.post('/projects', data);
  }

  update(id, data) {
    return apiClient.put(`/projects/${id}`, data);
  }

  remove(id) {
    return apiClient.delete(`/projects/${id}`);
  }

  addItem(projectId, data) {
    return apiClient.post(`/projects/${projectId}/items`, data);
  }

  removeItem(projectId, itemId) {
    return apiClient.delete(`/projects/${projectId}/items/${itemId}`);
  }
}

export default new ProjectService();
