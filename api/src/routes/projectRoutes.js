import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import { uploadProjectImage } from '../middlewares/upload.js';

const router = Router();

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

export default router;
