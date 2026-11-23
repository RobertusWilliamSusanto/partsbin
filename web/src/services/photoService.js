import { apiClient } from '../config/api';

// Service API foto dokumentasi proyek terpisah agar tidak membebani initial bundle JS
export const photoService = {
  // Unggah satu berkas foto dokumentasi dengan multipart/form-data dan batas waktu 30 detik
  async addPhoto(projectId, file, caption = '') {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) {
      formData.append('caption', caption);
    }

    return await apiClient.post(`/projects/${projectId}/photos`, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': undefined, // Kenapa undefined? Membiarkan browser otomatis menyusun header multipart dan boundary unik
      },
    });
  },

  // Perbarui teks keterangan (caption) pada foto yang sudah tersimpan
  async updateCaption(projectId, photoId, caption) {
    return await apiClient.patch(`/projects/${projectId}/photos/${photoId}`, {
      caption,
    });
  },

  // Hapus foto dokumentasi dari database dan storage
  async remove(projectId, photoId) {
    return await apiClient.delete(`/projects/${projectId}/photos/${photoId}`);
  },
};

export default photoService;
