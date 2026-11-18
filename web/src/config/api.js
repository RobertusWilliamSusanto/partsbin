import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Pola 1 Modul 5: satu instance Axios dengan interceptor untuk membuka res.data dan menormalisasi error
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status || null;
    const message =
      err.response?.data?.error ||
      (err.request
        ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
        : err.message);
    return Promise.reject({ message, status });
  }
);

export { apiClient, BASE_URL };
