import { apiClient } from '../config/api';

// Pola 2 Modul 5: service singleton pemanggil endpoint /components
class ComponentService {
  getAll() {
    return apiClient.get('/components');
  }

  getById(id) {
    return apiClient.get(`/components/${id}`);
  }

  create(data) {
    return apiClient.post('/components', data);
  }

  update(id, data) {
    return apiClient.put(`/components/${id}`, data);
  }

  updateStock(id, stock) {
    return apiClient.patch(`/components/${id}/stock`, { stock });
  }

  remove(id) {
    return apiClient.delete(`/components/${id}`);
  }
}

export default new ComponentService();
