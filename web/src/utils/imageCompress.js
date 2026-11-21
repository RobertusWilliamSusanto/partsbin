/**
 * Utilitas kompresi gambar sisi klien menggunakan HTML5 Canvas API & createImageBitmap.
 * Memenuhi Aturan Ringan & Spesifikasi Tahap 4B:
 * - MAX_SIDE = 1024 px (mempertahankan rasio aspek asli)
 * - Target ukuran < 200 KB (204.800 bytes)
 * - Loop kualitas adaptif: 0.8 -> 0.7 -> 0.6
 * - Mencoba format WebP; jika browser mengembalikan selain image/webp, fallback ke JPEG
 * - createImageBitmap dengan opsi { imageOrientation: 'from-image' } menangani rotasi EXIF kamera mobile
 * - bitmap.close() dipanggil di blok finally untuk mencegah kebocoran memori perangkat
 */

const MAX_SIDE = 1024;
const TARGET_SIZE_BYTES = 200 * 1024; // 200 KB
const QUALITY_STEPS = [0.8, 0.7, 0.6];

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export async function compressImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    return {
      file,
      blob: file,
      originalSize: file?.size || 0,
      compressedSize: file?.size || 0,
      mimeType: file?.type || 'application/octet-stream',
    };
  }

  const originalSize = file.size;
  let bitmap = null;

  try {
    // imageOrientation 'from-image' secara otomatis memperbaiki orientasi foto HP vertikal/miring
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    let { width, height } = bitmap;

    // Hitung proporsi dimensi dengan batas sisi terpanjang MAX_SIDE (1024px)
    if (width > MAX_SIDE || height > MAX_SIDE) {
      if (width >= height) {
        height = Math.round((height * MAX_SIDE) / width);
        width = MAX_SIDE;
      } else {
        width = Math.round((width * MAX_SIDE) / height);
        height = MAX_SIDE;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context tidak didukung oleh browser.');
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    // Uji dukungan WebP pada browser
    let targetMime = 'image/webp';
    let testBlob = await canvasToBlob(canvas, 'image/webp', 0.8);
    if (!testBlob || testBlob.type !== 'image/webp') {
      targetMime = 'image/jpeg';
      testBlob = await canvasToBlob(canvas, 'image/jpeg', 0.8);
    }

    let finalBlob = testBlob;

    // Loop kualitas bertingkat: 0.8 -> 0.7 -> 0.6 hingga ukuran < 200 KB
    for (const quality of QUALITY_STEPS) {
      const b = await canvasToBlob(canvas, targetMime, quality);
      if (b) {
        finalBlob = b;
        if (b.size <= TARGET_SIZE_BYTES) {
          break;
        }
      }
    }

    const extension = targetMime === 'image/webp' ? 'webp' : 'jpg';
    const compressedFile = new File(
      [finalBlob],
      `project_cover_${Date.now()}.${extension}`,
      {
        type: targetMime,
        lastModified: Date.now(),
      }
    );

    return {
      file: compressedFile,
      blob: finalBlob,
      originalSize,
      compressedSize: finalBlob.size,
      width,
      height,
      mimeType: targetMime,
    };
  } finally {
    // Bebaskan alokasi memori grafis browser pada bitmap
    if (bitmap && typeof bitmap.close === 'function') {
      bitmap.close();
    }
  }
}
