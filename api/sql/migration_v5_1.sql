-- =============================================================================
-- PARTSBIN — MIGRASI DATABASE v5.1 (IDEMPOTEN)
-- Menambahkan validasi batas maksimal 12 foto per proyek di tingkat database (trigger constraint)
-- untuk mencegah race condition (TOCTOU) saat request upload konkuren masuk bersamaan.
-- Jalankan file ini di Supabase SQL Editor setelah migration_v5.sql.
-- =============================================================================

-- 1. Fungsi trigger untuk memeriksa jumlah foto proyek dengan row-level lock
CREATE OR REPLACE FUNCTION check_max_project_photos()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Kunci baris proyek di tabel projects untuk serialisasi transaksi upload paralel
  PERFORM 1 FROM projects WHERE id = NEW.project_id FOR UPDATE;

  -- Hitung foto yang sudah ada untuk proyek tersebut
  SELECT count(*) INTO v_count
  FROM project_photos
  WHERE project_id = NEW.project_id;

  -- Batasi maksimal 12 foto per proyek
  IF v_count >= 12 THEN
    RAISE EXCEPTION 'Jumlah foto telah mencapai batas maksimal 12 foto per proyek.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Pasang trigger BEFORE INSERT pada tabel project_photos (idempoten)
DROP TRIGGER IF EXISTS trg_check_max_project_photos ON project_photos;
CREATE TRIGGER trg_check_max_project_photos
  BEFORE INSERT ON project_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_max_project_photos();

-- =============================================================================
-- SQL ROLLBACK (Jalankan hanya jika ingin membatalkan migrasi v5.1):
-- DROP TRIGGER IF EXISTS trg_check_max_project_photos ON project_photos;
-- DROP FUNCTION IF EXISTS check_max_project_photos();
-- =============================================================================
