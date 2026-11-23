import multer from 'multer';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Deteksi format gambar asli secara ketat HANYA dari magic bytes (header biner buffer),
 * mengabaikan klaim ekstensi atau MIME type dari client.
 * @param {Buffer} buffer - Buffer biner berkas
 * @returns {{ mime: string, ext: string } | null}
 */
export function detectImageFormatFromBuffer(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 (137, 80, 78, 71)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WebP: RIFF (bytes 0-3: 52 49 46 46) dan WEBP (bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

// Gunakan memoryStorage agar buffer tersimpan di RAM tanpa menyentuh disk serverless Vercel
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Hanya loloskan MIME type yang diizinkan pada parsing multipart awal
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Format berkas tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.');
    err.status = 400;
    cb(err, false);
  }
};

// Instance middleware multer 2.x limit 2 MB pada field 'image'
export const uploadProjectImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter,
}).single('image');

// Instance middleware multer untuk endpoint foto dokumentasi (image wajib, thumb opsional)
export const uploadProjectPhotoWithThumb = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB per file
  fileFilter,
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumb', maxCount: 1 },
]);
