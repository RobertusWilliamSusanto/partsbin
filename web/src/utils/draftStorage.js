// Pola 4 Modul 5: auto-save draf form tambah komponen ke localStorage agar ketikan tidak hilang
const DRAFT_KEY = 'partsbin_draft_component';

export function saveComponentDraft(formData) {
  const payload = {
    data: formData,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Abaikan jika penyimpanan browser penuh atau dibatasi
  }
  return payload.savedAt;
}

export function loadComponentDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
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
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Abaikan error storage
  }
}

export function hasComponentDraft() {
  return loadComponentDraft() !== null;
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
