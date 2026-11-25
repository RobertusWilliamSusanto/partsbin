// Satu sumber kebenaran untuk identitas pembuat dan info aplikasi (digunakan di ProfilePage)
// Catatan foto manual: taruh file gambar di folder `web/public/` (misal `web/public/profile.jpg`),
// lalu isi properti `photo: '/profile.jpg'`. Foto juga bisa diubah langsung dari UI (disimpan di localStorage).
export const STUDENT_PROFILE = {
  name: 'Robertus William Susanto',
  nim: '21120124120007',
  major: 'Teknik Komputer',
  university: 'Universitas Diponegoro',
  course: 'Praktikum PPB Ganjil 2026',
  photo: '',
};

const PROFILE_STORAGE_KEY = 'partsbin_profile_v1';

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...STUDENT_PROFILE };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...STUDENT_PROFILE, ...parsed };
    }
  } catch {
    // Abaikan jika penyimpanan browser dibatasi
  }
  return { ...STUDENT_PROFILE };
}

export function saveProfile(profile) {
  const next = {
    name: (profile.name || '').trim() || STUDENT_PROFILE.name,
    nim: (profile.nim || '').trim() || STUDENT_PROFILE.nim,
    major: (profile.major || '').trim() || STUDENT_PROFILE.major,
    university: (profile.university || '').trim() || STUDENT_PROFILE.university,
    course: (profile.course || '').trim() || STUDENT_PROFILE.course,
    photo: typeof profile.photo === 'string' ? profile.photo : '',
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Abaikan jika kuota localStorage penuh atau dibatasi
  }
  return next;
}

export function resetProfile() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Abaikan error storage
  }
  return { ...STUDENT_PROFILE };
}

export function hasCustomProfile() {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

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
