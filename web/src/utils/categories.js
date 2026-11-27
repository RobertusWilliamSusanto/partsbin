export const DEFAULT_CATEGORIES = [
  'MCU',
  'Sensor',
  'Passive',
  'Power',
  'Actuator',
  'Connector',
  'Display',
];

const CUSTOM_CATEGORIES_KEY = 'partsbin:custom_categories';

/** Validasi nama kategori komponen (teks non-kosong, maks 50 karakter). */
export function isValidCategory(category) {
  if (typeof category !== 'string') return false;
  const trimmed = category.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}

/** Membaca daftar kategori kustom yang pernah ditambahkan pengguna dari localStorage. */
export function loadCustomCategories() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCategory).map((c) => c.trim());
  } catch {
    return [];
  }
}

/** Menyimpan kategori baru ke localStorage secara idempoten (hindari duplikat beda huruf besar/kecil). */
export function saveCustomCategory(rawCategory) {
  if (!isValidCategory(rawCategory)) return null;
  const trimmed = rawCategory.trim();
  const lower = trimmed.toLowerCase();

  const existingDefault = DEFAULT_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (existingDefault) return existingDefault;

  const custom = loadCustomCategories();
  const existingCustom = custom.find((c) => c.toLowerCase() === lower);
  if (existingCustom) return existingCustom;

  const next = [...custom, trimmed];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
    } catch {
      // Abaikan jika storage penuh/diblokir; kategori tetap dipakai di state aktif
    }
  }
  return trimmed;
}

/** Menggabungkan kategori bawaan, kategori kustom tersimpan, dan kategori dari data komponen. */
export function getAvailableCategories(components = [], extraCategories = []) {
  const seen = new Set();
  const result = [];

  const addUnique = (cat) => {
    if (!isValidCategory(cat)) return;
    const trimmed = cat.trim();
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  DEFAULT_CATEGORIES.forEach(addUnique);
  loadCustomCategories().forEach(addUnique);
  for (const comp of components) {
    addUnique(comp?.category);
  }
  for (const extra of extraCategories) {
    addUnique(extra);
  }

  return result;
}
