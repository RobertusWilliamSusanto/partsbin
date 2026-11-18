import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import componentService from '../../services/componentService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  saveComponentDraft,
  loadComponentDraft,
  clearComponentDraft,
  formatDraftTime,
} from '../../utils/draftStorage';

const CATEGORIES = ['MCU', 'Sensor', 'Passive', 'Power', 'Actuator', 'Connector', 'Display'];

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

function ComponentFormDialog({ initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData?.id);
  const isOnline = useOnlineStatus();

  const [form, setForm] = useState(() => toFormState(initialData));
  const [savedDraft, setSavedDraft] = useState(() => (isEdit ? null : loadComponentDraft()));
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [submitting, onClose]);

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    // Kenapa auto-save hanya di mode Tambah? Supaya draf tidak menimpa data saat mengedit komponen lama.
    if (!isEdit) {
      const savedAt = saveComponentDraft(next);
      setLastSavedAt(savedAt);
    }
  };

  const handleLoadDraft = () => {
    if (!savedDraft?.data) return;
    setForm({ ...EMPTY_FORM, ...savedDraft.data });
    setLastSavedAt(savedDraft.savedAt || null);
    setSavedDraft(null);
  };

  const handleDiscardDraft = () => {
    clearComponentDraft();
    setSavedDraft(null);
    setLastSavedAt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const res = isEdit
        ? await componentService.update(initialData.id, payload)
        : await componentService.create(payload);

      if (!isEdit) clearComponentDraft();
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data komponen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="component-form-title"
      onClick={() => !submitting && onClose?.()}
    >
      <div className="modal-box glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="component-form-title" className="modal-title">
            {isEdit ? 'Edit Komponen' : 'Tambah Komponen Baru'}
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup form"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
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
          <div className="form-group">
            <label className="form-label" htmlFor="comp-name">Nama Komponen</label>
            <input
              id="comp-name"
              className="form-input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Contoh: ESP32-WROOM-32 DevKit"
              maxLength={120}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="comp-category">Kategori</label>
              <select
                id="comp-category"
                className="form-select"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="comp-bin">Lokasi Laci</label>
              <input
                id="comp-bin"
                className="form-input"
                value={form.bin_location}
                onChange={(e) => handleChange('bin_location', e.target.value)}
                placeholder="Contoh: A-01"
                maxLength={40}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="comp-stock">Stok Saat Ini</label>
              <input
                id="comp-stock"
                type="number"
                min="0"
                step="1"
                className="form-input num"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="comp-min-stock">Stok Minimum</label>
              <input
                id="comp-min-stock"
                type="number"
                min="0"
                step="1"
                className="form-input num"
                value={form.min_stock}
                onChange={(e) => handleChange('min_stock', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comp-price">Harga Satuan (Rp)</label>
            <input
              id="comp-price"
              type="number"
              min="0"
              step="1"
              className="form-input num"
              value={form.unit_price}
              onChange={(e) => handleChange('unit_price', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comp-specs">Spesifikasi Teknis</label>
            <textarea
              id="comp-specs"
              className="form-textarea"
              value={form.specs}
              onChange={(e) => handleChange('specs', e.target.value)}
              placeholder="Tegangan kerja, paket SMD/THT, catatan pinout..."
            />
          </div>

          {!isEdit && lastSavedAt && (
            <div className="row-between">
              <span className="count">Draf tersimpan pukul {formatDraftTime(lastSavedAt)}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleDiscardDraft}>
                Hapus Draf
              </button>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
              Batal
            </button>
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
    </div>
  );
}

export default function ComponentFormModal({ isOpen, initialData = null, onClose, onSaved }) {
  if (!isOpen) return null;
  return <ComponentFormDialog initialData={initialData} onClose={onClose} onSaved={onSaved} />;
}
