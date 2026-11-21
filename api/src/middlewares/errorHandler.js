import multer from 'multer';

// Middleware penanganan error terpusat agar seluruh respons gagal konsisten berformat { error: "..." }
export function errorHandler(err, req, res, _next) {
  // 1. Penolakan origin oleh kebijakan CORS
  if (err.isCors) {
    return res.status(403).json({
      error: err.message || 'Akses ditolak oleh kebijakan CORS.',
    });
  }

  // 2. Error dari middleware Multer (ukuran file melebihi limit atau format multipart rusak)
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Ukuran berkas gambar melebihi batas 2 MB.',
      });
    }
    return res.status(400).json({
      error: err.message || 'Gagal memproses unggahan berkas multipart.',
    });
  }

  // 3. Error kustom dengan status 400 (misal: MIME tidak didukung atau validasi magic bytes gagal)
  if (err.status === 400 || err.statusCode === 400) {
    return res.status(400).json({
      error: err.message || 'Format data request tidak valid.',
    });
  }

  // 4. Request body berformat JSON rusak (dilempar oleh express.json)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Format JSON pada request body tidak valid.',
    });
  }

  // 5. Data tidak ditemukan (kode bawaan PostgREST .single() atau dari model .delete().select())
  if (err.code === 'PGRST116') {
    return res.status(404).json({
      error: 'Data yang diminta tidak ditemukan.',
    });
  }

  // 6. Pelanggaran Foreign Key PostgreSQL
  if (err.code === '23503') {
    if (req.method === 'DELETE') {
      return res.status(409).json({
        error: 'Komponen tidak bisa dihapus karena masih dipakai di dalam BOM proyek.',
      });
    }
    return res.status(404).json({
      error: 'Proyek atau komponen yang direferensikan tidak ditemukan.',
    });
  }

  // 7. Pelanggaran Unique Constraint (duplikat pasangan project_id + component_id di BOM)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Komponen tersebut sudah terdaftar di dalam BOM proyek ini.',
    });
  }

  // 8. Pelanggaran NOT NULL (23502), CHECK constraint (23514), atau format UUID salah (22P02)
  if (['23502', '23514', '22P02'].includes(err.code)) {
    return res.status(400).json({
      error: 'Format data atau UUID tidak valid.',
    });
  }

  // 9. Error tak terduga: catat detail hanya di log server, kirim pesan generik ke client
  console.error('[API Error]', err);
  return res.status(500).json({
    error: 'Terjadi kesalahan pada server.',
  });
}
