// Pola 4 Modul 5: auto-save draf form tambah komponen ke localStorage agar ketikan tidak hilang
const DRAFT_KEY = 'partsbin_draft_component';

export function saveComponentDraft(draftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  } catch {
    // Abaikan jika penyimpanan browser penuh atau dibatasi
  }
}

export function loadComponentDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
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
