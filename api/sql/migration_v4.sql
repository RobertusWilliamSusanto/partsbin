-- =============================================================================
-- PARTSBIN — MIGRASI DATABASE v4.0 (IDEMPOTEN)
-- Jalankan file ini di Supabase SQL Editor untuk memperbarui struktur v3.1 ke v4.0.
-- =============================================================================

-- 1. Tambah kolom status dan image_path ke tabel projects
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'planned' 
    CHECK (status IN ('planned', 'in_progress', 'done')),
  ADD COLUMN IF NOT EXISTS image_path TEXT DEFAULT NULL;

-- 2. Konfigurasi Bucket Supabase Storage 'project-images' (Public, Limit 2 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  2097152, -- 2 MB (2 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy RLS storage.objects khusus bucket project-images
-- Selalu DROP POLICY IF EXISTS sebelum CREATE agar idempoten jika dijalankan ulang
DROP POLICY IF EXISTS "Public Read project-images" ON storage.objects;
CREATE POLICY "Public Read project-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Backend Insert project-images" ON storage.objects;
CREATE POLICY "Backend Insert project-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Backend Update project-images" ON storage.objects;
CREATE POLICY "Backend Update project-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Backend Delete project-images" ON storage.objects;
CREATE POLICY "Backend Delete project-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images');
