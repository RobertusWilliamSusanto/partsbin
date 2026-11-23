-- =============================================================================
-- PARTSBIN — MIGRASI DATABASE v5.0 (IDEMPOTEN)
-- Menambahkan tabel project_photos untuk fitur Dokumentasi Proyek.
-- Jalankan file ini di Supabase SQL Editor untuk memperbarui struktur v4.0 ke v5.0.
-- =============================================================================

-- 1. Tabel dokumentasi foto proyek
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  caption VARCHAR(200) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index untuk mempercepat query galeri foto per proyek urut created_at
CREATE INDEX IF NOT EXISTS idx_project_photos_project_created 
  ON project_photos (project_id, created_at);

-- 3. Nonaktifkan RLS sesuai pola 3 tabel lain (Modul 1: anon key tanpa auth pengguna)
-- Catatan: Bila kelak RLS diaktifkan di tabel projects, tabel ini wajib diaktifkan juga
ALTER TABLE project_photos DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SQL ROLLBACK (Jalankan hanya jika ingin membatalkan migrasi v5.0):
-- DROP TABLE IF EXISTS project_photos CASCADE;
-- =============================================================================
