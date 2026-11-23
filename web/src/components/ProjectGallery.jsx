import { useState, useRef } from 'react';
import { ImagePlus, AlertCircle } from 'lucide-react';
import photoService from '../services/photoService';
import { compressImage } from '../utils/imageCompress';
import ConfirmModal from './modals/ConfirmModal';
import ProjectGalleryItem from './ProjectGalleryItem';

// Galeri dokumentasi proyek: grid 2 kolom, kompresi klien, batas 12 foto, dan unggah sekuensial
export default function ProjectGallery({ projectId, photos = [], onPhotoMutated, isOffline = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isTemp = typeof projectId === 'string' && projectId.startsWith('tmp_');
  const isActionDisabled = isOffline || isTemp || uploading;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = photos.length;
    if (currentCount >= 12) {
      setStatusMessage('Batas maksimal 12 foto per proyek telah tercapai.');
      e.target.value = '';
      return;
    }
    let filesToProcess = files;
    if (currentCount + files.length > 12) {
      const allowed = 12 - currentCount;
      filesToProcess = files.slice(0, allowed);
      setStatusMessage(`Hanya ${allowed} dari ${files.length} foto yang diproses karena batas 12 foto.`);
    } else {
      setStatusMessage('');
    }
    setUploading(true);
    let successCount = 0;
    let failCount = 0;
    // Alur sekuensial: kompres satu per satu lalu unggah ke backend
    for (let i = 0; i < filesToProcess.length; i++) {
      setUploadProgress(`Mengunggah ${i + 1}/${filesToProcess.length}...`);
      try {
        const compressed = await compressImage(filesToProcess[i]);
        await photoService.addPhoto(projectId, compressed.file);
        successCount++;
      } catch (err) {
        console.warn(`Unggah foto #${i + 1} gagal:`, err);
        failCount++;
      }
    }
    setUploading(false);
    setUploadProgress('');
    e.target.value = '';
    setStatusMessage(`${successCount} foto berhasil diunggah${failCount > 0 ? `, ${failCount} berkas gagal` : ''}.`);
    onPhotoMutated?.();
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    setDeleting(true);
    try {
      await photoService.remove(projectId, photoToDelete.id);
      setPhotoToDelete(null);
      setStatusMessage('Foto berhasil dihapus.');
      onPhotoMutated?.();
    } catch (err) {
      setStatusMessage(err?.message || 'Gagal menghapus foto.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card stack-md">
      <div className="list-head">
        <h2>Dokumentasi Foto</h2>
        <span className="count">{photos.length}/12</span>
      </div>
      {isTemp ? (
        <div className="alert alert--info">
          <AlertCircle size={16} />
          <span>Proyek sementara (belum sinkron ke server) belum dapat diberi foto.</span>
        </div>
      ) : isOffline ? (
        <div className="alert alert--info">
          <AlertCircle size={16} />
          <span>Unggah, ubah caption, dan hapus foto hanya dapat dilakukan saat online.</span>
        </div>
      ) : null}
      <div className="row-wrap">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={handleFileChange}
          disabled={isActionDisabled || photos.length >= 12}
        />
        <button
          type="button"
          className="btn btn--outline"
          style={{ flex: 1 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isActionDisabled || photos.length >= 12}
        >
          <ImagePlus size={18} />
          <span>{uploading ? uploadProgress : photos.length >= 12 ? 'Maksimal 12 Foto' : 'Tambah Foto'}</span>
        </button>
      </div>

      {statusMessage && <p className="muted" style={{ fontSize: '0.8125rem' }}>{statusMessage}</p>}
      {photos.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: '16px 0' }}>
          Belum ada foto dokumentasi. Tambahkan foto perakitan proyek di sini.
        </p>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo, idx) => (
            <ProjectGalleryItem
              key={photo.id || idx}
              photo={photo}
              index={idx}
              projectId={projectId}
              disabled={isActionDisabled}
              onCaptionUpdated={onPhotoMutated}
              onRequestDelete={(p) => setPhotoToDelete(p)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(photoToDelete)}
        title="Hapus Foto Dokumentasi?"
        message="Foto yang dihapus tidak dapat dipulihkan."
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  );
}
