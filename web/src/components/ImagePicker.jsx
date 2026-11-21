import { useState, useRef } from 'react';
import { Image as ImageIcon, Camera, Trash2, RefreshCw } from 'lucide-react';
import { compressImage } from '../utils/imageCompress';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Komponen pemilih sampul proyek dengan dukungan Galeri, Kamera fisik HP, kompresi Canvas, dan preview 4:3
export default function ImagePicker({ file, onChange, onRemove, disabled }) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const handleProcessFile = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Reset input value agar dapat memilih file yang sama jika diinginkan
    e.target.value = '';
    setError(null);
    setCompressing(true);

    try {
      const result = await compressImage(rawFile);
      const url = URL.createObjectURL(result.blob);
      setPreviewUrl(url);

      const savings =
        result.originalSize > 0
          ? Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)
          : 0;

      setStats({
        original: result.originalSize,
        compressed: result.compressedSize,
        savings: Math.max(0, savings),
        mime: result.mimeType,
      });

      if (onChange) {
        onChange(result.file);
      }
    } catch (err) {
      setError(err?.message || 'Gagal memproses dan mengompresi gambar.');
    } finally {
      setCompressing(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStats(null);
    setError(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="form-group stack-sm">
      <label className="form-label">Sampul Dokumentasi Proyek (Opsional)</label>

      {/* Hidden file inputs: Galeri vs Kamera */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleProcessFile}
        disabled={disabled || compressing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleProcessFile}
        disabled={disabled || compressing}
      />

      {compressing && (
        <div className="card loading-state" role="status" style={{ minHeight: 120 }}>
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Mengompresi gambar dengan Canvas API...</span>
        </div>
      )}

      {!compressing && !previewUrl && !file && (
        <div className="stack-sm">
          <div className="row-wrap">
            <button
              type="button"
              className="btn btn--outline"
              style={{ flex: 1, minHeight: 44 }}
              onClick={() => galleryInputRef.current?.click()}
              disabled={disabled}
            >
              <ImageIcon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>Pilih dari Galeri</span>
            </button>
            <button
              type="button"
              className="btn btn--outline"
              style={{ flex: 1, minHeight: 44 }}
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
            >
              <Camera size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>Ambil Foto</span>
            </button>
          </div>
          <span className="count">
            Maks. 1024px, rasio 4:3, otomatis terkompresi &lt; 200 KB (EXIF auto-rotate).
          </span>
        </div>
      )}

      {!compressing && previewUrl && (
        <div className="stack-sm">
          <div className="project-cover" style={{ borderRadius: 8, overflow: 'hidden' }}>
            <img
              src={previewUrl}
              alt="Pratinjau sampul proyek"
              className="project-cover__img"
              width="400"
              height="300"
            />
          </div>

          {stats && (
            <div className="spec-cell" style={{ padding: '8px 12px' }}>
              <div className="row-between">
                <span className="count">Ukuran Asli: {formatBytes(stats.original)}</span>
                <span className="count">Terkompresi: {formatBytes(stats.compressed)}</span>
              </div>
              <div className="row-between" style={{ marginTop: 2 }}>
                <span className="price" style={{ fontSize: '0.85rem' }}>
                  Hemat {stats.savings}% ({stats.mime.replace('image/', '')})
                </span>
                <span className="count">Rasio 4:3</span>
              </div>
            </div>
          )}

          <div className="row-wrap">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              style={{ flex: 1, minHeight: 44 }}
              onClick={() => galleryInputRef.current?.click()}
              disabled={disabled}
            >
              <ImageIcon size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Ganti Foto</span>
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ minHeight: 44 }}
              onClick={handleClear}
              disabled={disabled}
              aria-label="Hapus foto terpilih"
            >
              <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
