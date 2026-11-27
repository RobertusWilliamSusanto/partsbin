-- =============================================================================
-- PARTSBIN — MIGRASI v6: KATEGORI KOMPONEN DINAMIS
-- Jalankan file ini di Supabase SQL Editor agar dropdown kategori komponen
-- dapat menerima kategori baru langsung dari antarmuka web.
-- =============================================================================

-- 1. Hapus semua CHECK constraint lama pada kolom components.category
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'components'
      AND c.contype = 'c'
      AND a.attname = 'category'
  LOOP
    EXECUTE format('ALTER TABLE components DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 2. Pastikan kategori tidak kosong dan maksimal 50 karakter
ALTER TABLE components
  ADD CONSTRAINT components_category_nonempty CHECK (length(btrim(category)) BETWEEN 1 AND 50);
