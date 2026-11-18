import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import projectService from '../../services/projectService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

function ProjectFormDialog({ initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData?.id);
  const isOnline = useOnlineStatus();

  const [name, setName] = useState(() => initialData?.name ?? '');
  const [description, setDescription] = useState(() => initialData?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [submitting, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama proyek wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: trimmedName, description: description.trim() };
      const res = isEdit
        ? await projectService.update(initialData.id, payload)
        : await projectService.create(payload);
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data proyek.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-form-title"
      onClick={() => !submitting && onClose?.()}
    >
      <div className="modal-box glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="project-form-title" className="modal-title">
            {isEdit ? 'Edit Proyek' : 'Tambah Proyek Baru'}
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup form proyek"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="alert alert--danger" role="alert">
            <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form className="stack-md" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="proj-name">Nama Proyek</label>
            <input
              id="proj-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Smart Hydroponics Controller"
              maxLength={120}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="proj-desc">Deskripsi Proyek</label>
            <textarea
              id="proj-desc"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tujuan rangkaian, target mikrokontroler, atau catatan perakitan..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting || !isOnline}>
              <Save size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Proyek'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectFormModal({ isOpen, initialData = null, onClose, onSaved }) {
  if (!isOpen) return null;
  return <ProjectFormDialog initialData={initialData} onClose={onClose} onSaved={onSaved} />;
}
