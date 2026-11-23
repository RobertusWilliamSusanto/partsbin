-- =============================================================================
-- PARTSBIN — SKEMA DATABASE POSTGRESQL (SUPABASE)
-- Jalankan file ini di Supabase SQL Editor sebelum menjalankan seed.sql.
-- =============================================================================

-- Hapus komentar di bawah HANYA jika ingin mereset seluruh tabel dari nol:
-- DROP TABLE IF EXISTS project_photos, project_items, projects, components CASCADE;

-- 1. Tabel utama katalog komponen elektronika
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (
    category IN ('MCU', 'Sensor', 'Passive', 'Power', 'Actuator', 'Connector', 'Display')
  ),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 2 CHECK (min_stock >= 0),
  unit_price INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  bin_location VARCHAR(40) NOT NULL,
  specs TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel daftar proyek elektronika
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabel relasi Bill of Materials (BOM) antara proyek dan komponen
-- Kenapa ON DELETE CASCADE pada project_id? Jika proyek dihapus, item BOM miliknya ikut bersih otomatis.
-- Kenapa ON DELETE RESTRICT pada component_id? Mencegah komponen terhapus jika masih dipakai proyek aktif (409 Conflict).
CREATE TABLE IF NOT EXISTS project_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
  quantity_needed INTEGER NOT NULL CHECK (quantity_needed > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_component UNIQUE (project_id, component_id)
);

-- 4. Tabel dokumentasi foto proyek (banyak foto per proyek)
-- Kenapa ON DELETE CASCADE? Foto proyek ikut terhapus otomatis saat proyek dihapus.
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  thumb_path TEXT,
  caption VARCHAR(200) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk mempercepat filter kategori dan join relasi BOM
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_project_items_project_id ON project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_project_items_component_id ON project_items(component_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_project_created ON project_photos(project_id, created_at);

-- Nonaktifkan RLS sesuai standar Modul 1 (menggunakan Supabase anon key tanpa autentikasi pengguna)
ALTER TABLE components DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos DISABLE ROW LEVEL SECURITY;
