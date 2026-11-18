import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Pola 3 Modul 5: dialog konfirmasi kustom sebagai pengganti window.confirm
export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => !loading && onCancel?.()}
    >
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row-wrap">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <h3 id="confirm-modal-title" className="modal-title">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup dialog"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <p className="muted">{message}</p>

        {error && (
          <div className="alert alert--danger" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
