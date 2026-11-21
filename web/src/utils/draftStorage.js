// Auto-save draf form tambah komponen & kalkulator proyek ke localStorage agar data tidak hilang saat refresh
const COMPONENT_DRAFT_KEY = 'partsbin_draft_component';
const CALCULATOR_DRAFT_KEY = 'partsbin_draft_calculator';

// --- Draf Komponen ---
export function saveComponentDraft(formData) {
  const payload = {
    data: formData,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COMPONENT_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Abaikan jika penyimpanan browser dibatasi
  }
  return payload;
}

export function loadComponentDraft() {
  try {
    const raw = localStorage.getItem(COMPONENT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      return parsed;
    }
    return { data: parsed, savedAt: null };
  } catch {
    return null;
  }
}

export function clearComponentDraft() {
  try {
    localStorage.removeItem(COMPONENT_DRAFT_KEY);
  } catch {
    // Abaikan error storage
  }
}

export function hasComponentDraft() {
  return loadComponentDraft() !== null;
}

export const hasDraft = hasComponentDraft;

// --- Draf Kalkulator Proyek ---
// Catatan: Hanya menyimpan name, description, dan daftar item BOM ({ component_id, quantity_needed })
// Berkas gambar File/Blob sengaja TIDAK disimpan di localStorage demi efisiensi kuota browser
export function saveCalculatorDraft(calcData) {
  const payload = {
    data: {
      name: calcData.name || '',
      description: calcData.description || '',
      bomItems: Array.isArray(calcData.bomItems)
        ? calcData.bomItems.map((it) => ({
            component_id: it.component_id,
            quantity_needed: it.quantity_needed || 1,
          }))
        : [],
    },
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CALCULATOR_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Abaikan error kuota
  }
  return payload;
}

export function loadCalculatorDraft() {
  try {
    const raw = localStorage.getItem(CALCULATOR_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      return parsed;
    }
    return { data: parsed, savedAt: null };
  } catch {
    return null;
  }
}

export function clearCalculatorDraft() {
  try {
    localStorage.removeItem(CALCULATOR_DRAFT_KEY);
  } catch {
    // Abaikan error storage
  }
}

export function hasCalculatorDraft() {
  return loadCalculatorDraft() !== null;
}

export function formatDraftTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
