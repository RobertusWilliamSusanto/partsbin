// Middleware penanganan error terpusat agar seluruh respons gagal konsisten berformat { error: "..." }
export function errorHandler(err, req, res, _next) {
  // 1. Penolakan origin oleh konfigurasi CORS
  if (err.isCors) {
    return res.status(403).json({
      error: err.message || 'Akses ditolak oleh kebijakan CORS.',
    });
  }

  // 2. Request body berformat JSON rusak (dilempar oleh express.json)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Format JSON pada request body tidak valid.',
    });
  }

  // 3. Data tidak ditemukan (kode bawaan PostgREST .single() atau dari model .delete().select())
  if (err.code === 'PGRST116') {
    return res.status(404).json({
      error: 'Data yang diminta tidak ditemukan.',
    });
  }

  // 4. Pelanggaran Foreign Key PostgreSQL
  if (err.code === '23503') {
    // Kenapa dibedakan berdasar req.method?
    // Saat DELETE komponen gagal karena ON DELETE RESTRICT -> 409 Conflict.
    // Saat POST item BOM merujuk project_id/component_id yang tidak ada -> 404 Not Found.
    if (req.method === 'DELETE') {
      return res.status(409).json({
        error: 'Komponen tidak bisa dihapus karena masih dipakai di dalam BOM proyek.',
      });
    }
    return res.status(404).json({
      error: 'Proyek atau komponen yang direferensikan tidak ditemukan.',
    });
  }

  // 5. Pelanggaran Unique Constraint (duplikat pasangan project_id + component_id di BOM)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Komponen tersebut sudah terdaftar di dalam BOM proyek ini.',
    });
  }

  // 6. Pelanggaran NOT NULL (23502), CHECK constraint (23514), atau format UUID salah (22P02)
  if (['23502', '23514', '22P02'].includes(err.code)) {
    return res.status(400).json({
      error: 'Format data atau UUID tidak valid.',
    });
  }

  // 7. Error tak terduga: catat detail hanya di log server, kirim pesan generik ke client
  console.error('[API Error]', err);
  return res.status(500).json({
    error: 'Terjadi kesalahan pada server.',
  });
}
