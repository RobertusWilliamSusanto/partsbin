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

// Render canvas dan kompresi kualitas bertingkat untuk rendisi tertentu
async function renderRendition(bitmap, maxSide, targetBytes, qualitySteps, filePrefix) {
  let { width, height } = bitmap;
  if (width > maxSide || height > maxSide) {
    if (width >= height) {
      height = Math.round((height * maxSide) / width);
      width = maxSide;
    } else {
      width = Math.round((width * maxSide) / height);
      height = maxSide;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak didukung.');
  ctx.drawImage(bitmap, 0, 0, width, height);

  let targetMime = 'image/webp';
  let testBlob = await canvasToBlob(canvas, 'image/webp', qualitySteps[0]);
  if (!testBlob || testBlob.type !== 'image/webp') {
    targetMime = 'image/jpeg';
    testBlob = await canvasToBlob(canvas, 'image/jpeg', qualitySteps[0]);
  }
  let finalBlob = testBlob;
  for (const q of qualitySteps) {
    const b = await canvasToBlob(canvas, targetMime, q);
    if (b) {
      finalBlob = b;
      if (b.size <= targetBytes) break;
    }
  }
  const ext = targetMime === 'image/webp' ? 'webp' : 'jpg';
  const file = new File([finalBlob], `${filePrefix}_${Date.now()}.${ext}`, {
    type: targetMime,
    lastModified: Date.now(),
  });
  return { file, blob: finalBlob, compressedSize: finalBlob.size, width, height, mimeType: targetMime };
}

// Kompresi rendisi ganda (full 1024px & thumbnail 720px) dengan sekali decode bitmap
export async function compressWithThumb(file) {
  if (!file || !file.type.startsWith('image/')) {
    return {
      full: { file, blob: file, originalSize: file?.size || 0, compressedSize: file?.size || 0, mimeType: file?.type || '' },
      thumb: null,
    };
  }
  const originalSize = file.size;
  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const full = await renderRendition(bitmap, 1024, 200 * 1024, [0.8, 0.7, 0.6], 'doc_full');
    const thumb = await renderRendition(bitmap, 720, 80 * 1024, [0.75, 0.65, 0.55], 'doc_thumb');
    return {
      full: { ...full, originalSize },
      thumb: { ...thumb, originalSize },
    };
  } finally {
    if (bitmap && typeof bitmap.close === 'function') bitmap.close();
  }
}
