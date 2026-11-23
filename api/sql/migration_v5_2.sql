-- =============================================================================
-- PARTSBIN — MIGRASI DATABASE v5.2 (IDEMPOTEN)
-- Menghapus trigger dan function check_max_project_photos (migrasi v5.1 dibatalkan).
-- Batas foto dipindahkan menjadi batas lunak di lapisan aplikasi (MAX_PHOTOS_PER_PROJECT = 60).
-- Jalankan file ini di Supabase SQL Editor setelah migration_v5_1.sql.
-- =============================================================================

-- 1. Hapus trigger jika ada
DROP TRIGGER IF EXISTS trg_check_max_project_photos ON project_photos;

-- 2. Hapus fungsi trigger jika ada
DROP FUNCTION IF EXISTS check_max_project_photos();

-- 3. Muat ulang skema PostgREST Supabase
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- SQL ROLLBACK (Jalankan hanya jika ingin memulihkan trigger v5.1):
-- CREATE OR REPLACE FUNCTION check_max_project_photos()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   v_count INTEGER;
-- BEGIN
--   PERFORM 1 FROM projects WHERE id = NEW.project_id FOR UPDATE;
--   SELECT count(*) INTO v_count FROM project_photos WHERE project_id = NEW.project_id;
--   IF v_count >= 12 THEN
--     RAISE EXCEPTION 'Jumlah foto telah mencapai batas maksimal 12 foto per proyek.'
--       USING ERRCODE = 'check_violation';
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- CREATE TRIGGER trg_check_max_project_photos
--   BEFORE INSERT ON project_photos
--   FOR EACH ROW
--   EXECUTE FUNCTION check_max_project_photos();
-- =============================================================================
