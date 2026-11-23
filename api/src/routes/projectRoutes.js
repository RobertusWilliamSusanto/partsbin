import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import { uploadProjectImage } from '../middlewares/upload.js';
import { validateUuidParam } from '../middlewares/validateUuid.js';

const router = Router();

// Validasi format UUID untuk seluruh parameter :id, :itemId, dan :photoId sebelum masuk ke controller
router.param('id', validateUuidParam);
router.param('itemId', validateUuidParam);
router.param('photoId', validateUuidParam);

// Endpoint utama CRUD proyek
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);

// Endpoint #15: Perbarui status pengerjaan proyek (planned | in_progress | done)
router.patch('/:id/status', projectController.updateStatus);

// Endpoint #16: Unggah foto dokumentasi proyek ke Supabase Storage (multipart/form-data)
// Urutan middleware ketat:
// 1. checkProjectExistsBeforeUpload: Validasi format UUID dan cek proyek ada di DB (400 / 404)
// 2. uploadProjectImage: Parsing multipart, batasi file <= 2 MB
// 3. uploadImage: Validasi file, inspeksi magic bytes, upload ke Storage, dan simpan path
router.post(
  '/:id/image',
  projectController.checkProjectExistsBeforeUpload,
  uploadProjectImage,
  projectController.uploadImage
);

// Endpoint relasi item BOM pada proyek tertentu
router.post('/:id/items', projectController.addItem);
router.delete('/:id/items/:itemId', projectController.removeItem);

// Endpoint #17: Unggah foto dokumentasi proyek ke galeri (multipart/form-data)
router.post('/:id/photos', uploadProjectImage, projectController.addPhoto);

// Endpoint #18: Perbarui teks caption foto dokumentasi
router.patch('/:id/photos/:photoId', projectController.updatePhotoCaption);

// Endpoint #19: Hapus foto dokumentasi proyek beserta berkas di Storage
router.delete('/:id/photos/:photoId', projectController.removePhoto);

export default router;
