import { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, Trash2, AlertCircle, X } from 'lucide-react';
import componentService from '../services/componentService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { invalidateComponentsCache, updateComponentInCache } from '../hooks/useComponents';
import { invalidateProjectsCache } from '../hooks/useProjects';
import {
  saveComponentDraft,
  loadComponentDraft,
  clearComponentDraft,
  formatDraftTime,
} from '../utils/draftStorage';
import ComponentFormFields from './ComponentFormFields';

const EMPTY_FORM = {
  name: '',
  category: 'MCU',
  stock: '0',
  min_stock: '2',
  unit_price: '0',
  bin_location: '',
  specs: '',
};

function toFormState(initialData) {
  if (!initialData) return EMPTY_FORM;
  return {
    name: initialData.name ?? '',
    category: initialData.category ?? 'MCU',
    stock: String(initialData.stock ?? 0),
    min_stock: String(initialData.min_stock ?? 2),
    unit_price: String(initialData.unit_price ?? 0),
    bin_location: initialData.bin_location ?? '',
    specs: initialData.specs ?? '',
  };
}

// Form inline terintegrasi (tanpa pop-up modal) untuk Tambah Komponen & Edit in-place
export default function ComponentInlineForm({ initialData = null, onCancel, onSaved }) {
  const isEdit = Boolean(initialData?.id);
  const isOnline = useOnlineStatus();

  const [form, setForm] = useState(() => toFormState(initialData));
  const [savedDraft, setSavedDraft] = useState(() => (isEdit ? null : loadComponentDraft()));
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const draftTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);

    if (!isEdit) {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        const saved = saveComponentDraft(next);
        if (saved) setLastSavedAt(saved.savedAt);
      }, 400);
    }
  };

  const handleLoadDraft = () => {
    if (!savedDraft) return;
    setForm(toFormState(savedDraft));
    setLastSavedAt(savedDraft.savedAt);
    setSavedDraft(null);
  };

  const handleDiscardDraft = () => {
    clearComponentDraft();
    setSavedDraft(null);
    setLastSavedAt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      setError('Aksi ini memerlukan koneksi internet. Anda sedang offline.');
      return;
    }
    setError(null);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      stock: Number(form.stock),
      min_stock: Number(form.min_stock),
      unit_price: Number(form.unit_price),
      bin_location: form.bin_location.trim(),
      specs: form.specs.trim(),
    };

    if (!payload.name || !payload.bin_location) {
      setError('Nama komponen dan lokasi laci wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isEdit) {
        res = await componentService.update(initialData.id, payload);
        updateComponentInCache(res.data);
      } else {
        res = await componentService.create(payload);
        clearComponentDraft();
        invalidateComponentsCache();
      }
      invalidateProjectsCache();
      if (onSaved) onSaved(res.data);
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data komponen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card stack-md inline-form-panel">
      <div className="card-head">
        <h2 className="card-title">{isEdit ? 'Edit Data Komponen' : 'Tambah Komponen Baru'}</h2>
        {onCancel && (
          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Tutup form komponen"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {!isEdit && savedDraft && (
        <div className="draft-banner">
          <span>
            Draf tersimpan ditemukan
            {savedDraft.savedAt ? ` (pukul ${formatDraftTime(savedDraft.savedAt)})` : ''}.
          </span>
          <div className="row-wrap">
            <button type="button" className="btn btn--outline btn--sm" onClick={handleLoadDraft}>
              <RotateCcw size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Muat Draf</span>
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleDiscardDraft}>
              <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Hapus Draf</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert--danger" role="alert">
          <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form className="stack-md" onSubmit={handleSubmit}>
        <ComponentFormFields form={form} onChange={handleChange} />

        {!isEdit && lastSavedAt && (
          <div className="row-between">
            <span className="count">Draf tersimpan pukul {formatDraftTime(lastSavedAt)}</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleDiscardDraft}>
              Hapus Draf
            </button>
          </div>
        )}

        <div className="modal-footer">
          {onCancel && (
            <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
              Batal
            </button>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !isOnline}
          >
            <Save size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Komponen'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
