import { useState, useRef } from 'react';
import { ImagePlus, AlertCircle, RefreshCw } from 'lucide-react';
import photoService from '../services/photoService';
import { compressImage } from '../utils/imageCompress';
import ConfirmModal from './modals/ConfirmModal';
import ProjectGalleryItem from './ProjectGalleryItem';

const PAGE_SIZE = 12;

// Galeri dokumentasi proyek: grid 2 kolom, paginasi klien, batas kuota dinamis, dan antrean unggah sekuensial
export default function ProjectGallery({ projectId, photos = [], photoLimit = 12, onPhotoMutated, isOffline = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [failedFiles, setFailedFiles] = useState([]);
  const [prevProjectId, setPrevProjectId] = useState(projectId);

  // Reset batas tampilan foto saat berpindah proyek
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setVisibleCount(PAGE_SIZE);
    setFailedFiles([]);
    setStatusMessage('');
  }

  const isTemp = typeof projectId === 'string' && projectId.startsWith('tmp_');
  const isActionDisabled = isOffline || isTemp || uploading;

  // Proses antrean unggah massal secara sekuensial
  const processUploadQueue = async (queue, prefixMsg = '') => {
    if (!queue || queue.length === 0) return;
    setUploading(true);
    let successCount = 0;
    const failed = [];

    for (let i = 0; i < queue.length; i++) {
      const file = queue[i];
      setUploadProgress(`Mengunggah ${i + 1}/${queue.length}: ${file.name}...`);
      try {
        const compressed = await compressImage(file);
        await photoService.addPhoto(projectId, compressed.file);
        successCount++;
        onPhotoMutated?.();
      } catch (err) {
        console.warn(`Unggah berkas ${file.name} gagal:`, err);
        const isNet = !navigator.onLine || !err?.status || err.status === 0;
        if (isNet) {
          // Jaringan terputus: hentikan antrean dan simpan sisa berkas untuk coba lagi
          const remainingToRetry = [file, ...queue.slice(i + 1)];
          setFailedFiles(remainingToRetry);
          setUploading(false);
          setUploadProgress('');
          setStatusMessage(
            `Koneksi terputus saat mengunggah "${file.name}". ${successCount} foto berhasil diunggah.`
          );
          return;
        }
        // Gagal validasi (400/413): catat kegagalan dan lanjutkan berkas antrean berikutnya
        failed.push({ file, message: err?.message || 'Gagal' });
      }
    }

    setUploading(false);
    setUploadProgress('');
    setFailedFiles(failed.map((f) => f.file));

    let finalMsg = `${successCount} foto berhasil diunggah.`;
    if (failed.length > 0) {
      finalMsg += ` ${failed.length} berkas gagal.`;
    }
    if (prefixMsg) {
      finalMsg = `${prefixMsg} ${finalMsg}`;
    }
    setStatusMessage(finalMsg);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const currentCount = photos.length;
    const remainingQuota = Math.max(0, photoLimit - currentCount);

    if (remainingQuota <= 0) {
      setStatusMessage(`Batas maksimal ${photoLimit} foto per proyek telah tercapai.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingQuota);
    const skippedCount = files.length - filesToProcess.length;
    let prefixMsg = '';
    if (skippedCount > 0) {
      prefixMsg = `${skippedCount} berkas dilewati karena melebihi sisa kuota (${remainingQuota} foto).`;
    }

    await processUploadQueue(filesToProcess, prefixMsg);
  };

  const handleRetryFailed = async () => {
    if (failedFiles.length === 0 || isActionDisabled) return;
    const retryList = [...failedFiles];
    setFailedFiles([]);
    await processUploadQueue(retryList);
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

  const displayedPhotos = photos.slice(0, visibleCount);
  const remainingCount = photos.length - displayedPhotos.length;

  return (
    <div className="card stack-md">
      <div className="list-head">
        <h2>Dokumentasi Foto</h2>
        <span className="count">
          {photos.length}/{photoLimit}
        </span>
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
          disabled={isActionDisabled || photos.length >= photoLimit}
        />
        <button
          type="button"
          className="btn btn--outline"
          style={{ flex: 1 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isActionDisabled || photos.length >= photoLimit}
        >
          <ImagePlus size={18} />
          <span>{uploading ? uploadProgress : photos.length >= photoLimit ? `Maksimal ${photoLimit} Foto` : 'Tambah Foto'}</span>
        </button>
      </div>

      {statusMessage && (
        <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
          {statusMessage}
        </p>
      )}

      {failedFiles.length > 0 && !uploading && !isOffline && (
        <button
          type="button"
          className="btn btn--outline"
          onClick={handleRetryFailed}
          style={{ width: '100%' }}
        >
          <RefreshCw size={16} />
          <span>Coba lagi unggah yang gagal ({failedFiles.length} berkas)</span>
        </button>
      )}

      {photos.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: '16px 0' }}>
          Belum ada foto dokumentasi. Tambahkan foto perakitan proyek di sini.
        </p>
      ) : (
        <>
          <div className="gallery-grid">
            {displayedPhotos.map((photo, idx) => (
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

          {remainingCount > 0 && (
            <button
              type="button"
              className="btn btn--outline"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              <span>Tampilkan {PAGE_SIZE} lagi ({remainingCount} tersisa)</span>
            </button>
          )}
        </>
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
