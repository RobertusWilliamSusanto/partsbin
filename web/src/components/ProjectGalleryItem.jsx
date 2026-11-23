import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import photoService from '../services/photoService';

// Subkomponen per item foto galeri dengan edit caption inline dan fallback SVG
export default function ProjectGalleryItem({
  photo,
  index,
  projectId,
  disabled,
  onCaptionUpdated,
  onRequestDelete,
}) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [prevServerCaption, setPrevServerCaption] = useState(photo.caption || '');
  const [isSaving, setIsSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Selaraskan state lokal jika data foto dari server diperbarui
  if ((photo.caption || '') !== prevServerCaption) {
    setPrevServerCaption(photo.caption || '');
    setCaption(photo.caption || '');
  }

  const handleBlurOrEnter = async () => {
    const trimmed = caption.trim();
    if (trimmed === (photo.caption || '') || isSaving || disabled) return;
    setIsSaving(true);
    try {
      await photoService.updateCaption(projectId, photo.id, trimmed);
      onCaptionUpdated?.();
    } catch (err) {
      console.warn('Gagal memperbarui caption foto:', err);
      setCaption(photo.caption || '');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="gallery-item">
      <div className="gallery-item__img-wrapper">
        {!imgError && photo.image_url ? (
          <img
            src={photo.image_url}
            alt={photo.caption || `Foto dokumentasi ${index + 1}`}
            loading="lazy"
            decoding="async"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
            className="gallery-item__img"
          />
        ) : (
          <div className="gallery-item__fallback" aria-label="Gambar gagal dimuat">
            <svg viewBox="0 0 400 300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gallery-item__fallback-svg" aria-hidden="true">
              <rect x="50" y="50" width="300" height="200" rx="8" />
              <circle cx="130" cy="120" r="25" />
              <path d="M50 210l80-70 120 100 50-40 100 80" />
            </svg>
          </div>
        )}
        <button
          type="button"
          className="gallery-item__del-btn"
          onClick={() => onRequestDelete(photo)}
          disabled={disabled}
          title="Hapus foto"
          aria-label={`Hapus foto ${index + 1}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <input
        type="text"
        maxLength={200}
        className="gallery-item__caption-input"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={handleBlurOrEnter}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder="Tambah keterangan..."
        disabled={disabled || isSaving}
        title="Tekan Enter atau klik di luar untuk menyimpan (maks. 200 karakter)"
      />
    </div>
  );
}
