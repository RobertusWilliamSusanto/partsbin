-- =============================================================================
-- PARTSBIN — MIGRASI DATABASE v5.3 (IDEMPOTEN)
-- Menambahkan kolom thumb_path pada tabel project_photos untuk rendisi thumbnail klien.
-- Jalankan file ini di Supabase SQL Editor setelah migration_v5_2.sql.
-- =============================================================================

-- 1. Tambah kolom thumb_path jika belum ada
ALTER TABLE project_photos ADD COLUMN IF NOT EXISTS thumb_path TEXT;

-- 2. Muat ulang skema PostgREST Supabase
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- SQL ROLLBACK (Jalankan hanya jika ingin membatalkan migrasi v5.3):
-- ALTER TABLE project_photos DROP COLUMN IF EXISTS thumb_path;
-- NOTIFY pgrst, 'reload schema';
-- =============================================================================
