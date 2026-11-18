// Satu sumber kebenaran untuk identitas pembuat dan info aplikasi (digunakan di ProfilePage)
export const STUDENT_PROFILE = {
  name: 'Robertus William Susanto',
  nim: '21120124120007',
  major: 'Teknik Komputer',
  university: 'Universitas Diponegoro',
  course: 'Praktikum PPB Ganjil 2026',
};

export const APP_INFO = {
  name: 'PartsBin',
  tagline: 'Katalog Komponen Mikro & Kalkulator BOM Proyek Elektronika',
  version: '1.0.0',
  description:
    'Progressive Web App manajemen inventaris komponen elektronika pribadi yang terintegrasi dengan kalkulator Bill of Materials (BOM) untuk menghitung persentase kesiapan rakit dan daftar belanja kekurangan komponen.',
  techStack: ['React', 'Vite', 'Express 5', 'Supabase (PostgreSQL)', 'Workbox PWA'],
  formulaSummary: {
    readiness: 'readiness_percent = Math.round((item_cukup / total_item) * 100)',
    shortage: 'shortage_qty = Math.max(0, quantity_needed - stock_available)',
    lowStock: 'is_low_stock = stock <= min_stock',
  },
};
