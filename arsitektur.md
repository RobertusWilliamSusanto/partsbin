# ARSITEKTUR SISTEM — PARTSBIN (v4.0)
**Katalog Komponen Mikro, Kalkulator BOM, & Manajemen Proyek Elektronika**
Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) Ganjil 2026

---

## 1. Gambaran Umum, Urutan Otoritas, & Gerbang Asprak
PartsBin adalah Progressive Web App (PWA) manajemen inventaris komponen elektronika pribadi yang terintegrasi dengan kalkulator *Bill of Materials* (BOM) untuk merencanakan proyek, menghitung persentase kesiapan rakit (*Build Readiness %*), mendeteksi daftar belanja kekurangan komponen (*Shopping Deficit*), melacak status pengerjaan fisik proyek (*Workflow Status*), dan menyimpan dokumentasi visual proyek.

### Aturan Wajib Asprak (Otoritas Tertinggi: R1–R12)
1. **R1**: Tugas individu *(Manual oleh Praktikan)*.
2. **R2**: Platform: Progressive Web App / PWA (`React` + `Vite` + `vite-plugin-pwa`, service worker, manifest, installable, offline runtime caching) *(Kode + Deploy)*.
3. **R3**: Memakai REST API (web service) buatan sendiri mengikuti arsitektur Modul 1 (`Express 5` + `Supabase`, folder `api/src/{config,routes,controllers,models}`) *(Kode)*.
4. **R4**: Memiliki *Bottom Navigation Bar* (*mobile-first*) yang terpasang konsisten di seluruh rute utama *(Kode)*.
5. **R5**: Minimal 5 halaman fungsional. PartsBin memiliki 6 rute halaman fungsional (`/`, `/components`, `/components/:id`, `/calculator`, `/projects/:id`, `/profile`) *(Kode)*.
6. **R6**: Minimal 2 halaman utama berisi *list*, setiap item bisa diklik menuju halaman *detail* (List 1: `/components` -> `/components/:id`; List 2: Dashboard `/` -> `/projects/:id`) *(Kode)*.
7. **R7**: Memiliki 1 halaman *Profile/About* (`/profile`) memuat identitas mahasiswa dan informasi arsitektur aplikasi *(Kode)*.
8. **R8**: Seluruh *source code* wajib tersimpan di repositori GitHub publik *(Manual oleh Praktikan)*.
9. **R9**: Judul dan topik tidak boleh sama dengan praktikan lain di platform yang sama *(Manual oleh Praktikan)*.
10. **R10**: Mengikuti asistensi minimal 1x dan mengisi lembar asistensi *(Manual oleh Praktikan)*.
11. **R11**: PWA wajib di-deploy di free hosting (Vercel); tautan repositori dicantumkan di kolom GitHub *(Kode + Deploy + Manual)*.
12. **R12**: Rentang pengerjaan 13–24 Nov 2026, responsi 25–28 Nov 2026; dilarang Protect Cell sebelum memiliki judul *(Manual oleh Praktikan)*.

**Dua Syarat Tersirat Wajib:**
- **Syarat Tersirat A (API Publik Ter-deploy)**: REST API backend (`api/`) juga wajib ter-deploy secara publik di Vercel (`https://partsbin-api.vercel.app/api`) dan dapat diakses oleh PWA frontend produksi tanpa kendala CORS.
- **Syarat Tersirat B (Kelayakan Data Demo)**: Basis data produksi wajib memiliki data demo yang memadai untuk membuktikan aturan R6 dan pagination (minimal 13 komponen dan 7 proyek dengan status pengerjaan bervariasi). Seluruh data demo dibuat secara bertahap melalui antarmuka aplikasi, **BUKAN** dengan mengeksekusi `seed.sql` (`TRUNCATE`) di database produksi yang dapat menghapus data riil.

### Keputusan Teknis Mandiri (Jujur untuk Responsi):
1. Penggunaan `react-router-dom` v7 agar seluruh rute memiliki URL unik (`/`, `/components`, `/components/:id`, `/calculator`, `/projects/:id`, `/profile`) dan navigasi *Back* perangkat mobile berfungsi di mode PWA *standalone*. Rute `/projects` dialihkan otomatis (`Navigate replace`) ke `/`.
2. Navigasi utama BottomNav 4 tab: Dashboard (`/`), Komponen (`/components`), Kalkulator (`/calculator`), Profil (`/profile`). Rute detail: `/components/:id` dan `/projects/:id`. BottomNav terpasang aktif di seluruh lebar layar dengan container seragam `max-width: 480px` terpusat (mobile notebook) tanpa layout desktop terpisah.
3. Client-side filtering & client-side pagination via hook `usePagination(items, pageSize=6, { syncUrl = true, resetKey })`. Dashboard dan Katalog Komponen menyinkronkan halaman ke URL query `?page=`. Pada Kalkulator (Tahap 4B), pemilihan komponen menggunakan elemen `<select>` standar inventaris yang sederhana dan stabil.
4. Pemisahan konsep: **Status Progres Pengerjaan** (`status`: `planned` | `in_progress` | `done`) vs **Kecukupan Stok Komponen** (*Build Readiness %*). Keduanya berdiri independen.
5. **Keputusan Sadar**: Status `done` **TIDAK** mengurangi stok komponen secara otomatis di database. Teknisi mengoreksi fisik stok secara transparan melalui stepper di katalog/detail komponen guna mencegah pengurangan ganda.
6. **Pencegahan Regresi List-Detail & Gerbang K6 (TERPENUHI di Tahap 4A)**: `DashboardPage.jsx` telah selesai ditingkatkan menjadi daftar proyek lengkap dengan filter status live dan pagination client-side. `ProjectListPage.jsx` telah dihapus secara aman; aturan R5 (minimal 5 halaman fungsional) dan R6 (minimal 2 list-detail) terpenuhi 100%.
7. **Aturan Ringan & Anggaran Kinerja (Tahap 4A s/d Selesai)**:
   - Anggaran bundle JS awal (gzip) maksimal 120.67 KB (tercapai 113.73 KB via `React.lazy` + `Suspense` untuk rute Kalkulator, Detail Proyek, dan Profil).
   - Grafis bawaan / placeholder = SVG inline buatan sendiri <= 1 KB, warna `currentColor`, tanpa gradient, filter (`feGaussianBlur`, `feDropShadow`), SMIL, atau `<script>`.
   - Gambar API wajib memakai atribut `loading="lazy"`, `decoding="async"`, `crossOrigin="anonymous"`, rasio `4:3`, dan fallback SVG saat `onError`.
   - Urutan pengerjaan fase: **Tahap 4A** (Layout, Navigasi, Dashboard list proyek, ProjectCover, Detail status) -> **Tahap 5** (PWA Offline, Service Worker, Webmanifest) -> **Tahap 4B** (Penyempurnaan Kalkulator dengan select & kompresi canvas).
8. **Arsitektur Offline-First & Sinkronisasi Latar Belakang (IndexedDB + Outbox FIFO)**:
   - **Perubahan Keputusan Sadar**: Memperbarui keputusan Bagian 7 Pola 4 yang sebelumnya menonaktifkan tombol Finalisasi Kalkulator saat offline. Kini pengguna tetap dapat membaca DAN melakukan mutasi data (edit, hapus, stepper stok, status proyek, buat komponen baru, dan buat proyek baru beserta BOM) saat offline.
   - **Penyimpanan Lokal & Antrean Mutasi**: Data disimpan lokal di IndexedDB (`partsbin_db`) dan antrean mutasi di-buffer pada store `outbox` (maksimal 200 operasi).
   - **ID Sementara (`tmp_*`) & Pemetaan**: Pembuatan data baru offline menghasilkan ID sementara `tmp_<crypto.randomUUID()>`. Saat online dan tersinkronisasi, server mengembalikan ID UUID riil yang dipetakan secara otomatis di store `idmap` serta memperbarui seluruh antrean turunan.
   - **Penyimpanan Berkas Gambar Offline**: Berkas blob gambar sampul proyek disimpan di store `blobs` IndexedDB (BUKAN di `localStorage`), lalu otomatis diunggah via endpoint #16 setelah proyek mendapatkan ID riil dari server.
   - **Penanganan Konflik**: Menggunakan strategi *Last-Write-Wins* (LWW) sederhana karena skema tabel PostgreSQL tidak memiliki kolom nomor versi atau konkurensi (keterbatasan yang disadari).
   - **Pencegahan Pembengkakan Bundle**: Seluruh modul offline (`db.js`, `outbox.js`, `syncEngine.js`, `offlineService.js`) dimuat secara dinamis lewat `import()` sehingga ukuran bundle JS awal (gzip) tetap berada di bawah batas ketat 120.67 KB.
9. **Dokumentasi Proyek & Cetak PDF (Fitur Tambahan v5.0)**:
   - **Galeri Foto Dokumentasi (Online-Only)**: Foto proyek disimpan pada tabel terpisah `project_photos` dengan berkas di bucket Supabase Storage `project-images` (`projects/<projectId>/docs/<uuid>.<ext>`). Mutasi foto (unggah, edit caption, hapus) HANYA diizinkan saat online dan pada proyek ber-ID riil (bukan `tmp_*`), karena berkas foto dokumentasi tidak diantrekan offline guna menjaga efisiensi kuota penyimpanan lokal dan mencegah lonjakan bandwidth sinkronisasi. Pembacaan galeri foto saat offline tetap didukung melalui cache Service Worker (`CacheFirst` dinaikkan ke 150 entri) dan IndexedDB.
   - **Batas 12 Foto & Kompresi Klien**: Setiap proyek dibatasi maksimal 12 foto dokumentasi guna melindungi kapasitas storage server. Kompresi gambar sisi klien menggunakan `imageCompress.js` (< 200 KB, maks 1024 px) sebelum pengunggahan sekuensial.
   - **Ekspor Dokumen PDF Biner Langsung (jsPDF Lazy) & Cetak Fisik Browser (@media print)**:
     - **Unduh PDF Langsung Sekali Klik**: Menggunakan utilitas `pdfExport.js` dengan `jsPDF` + `jspdf-autotable` yang dimuat secara dinamis (`import()`) saat tombol ditekan. Menghasilkan berkas `.pdf` biner nyata langsung terunduh ke perangkat pengguna tanpa memicu dialog printer bawaan OS yang kerap langsung mencetak ke printer fisik desktop.
     - **Cetak Dokumen Fisik**: Tetap menyediakan tombol "Cetak Dokumen" menggunakan stylesheet `@media print` A4 murni dan `window.print()` jika pengguna memang ingin mencetak ke lembar kertas fisik.
     - **Pencegahan Pembengkakan Bundle**: Karena `jsPDF` diimpor dinamis (lazy chunk), ukuran awal berkas bundle JS (`index.js` gzip) tetap berada di 117.85 KB (< 120.67 KB batas aman).
   - **Keterbatasan Jujur untuk Responsi**:
     1. Unduh berkas PDF biner langsung sekali klik (`.pdf` generated client-side via jsPDF lazy-load).
     2. Pada mode PWA iOS *standalone*, tombol "Cetak Dokumen" (window.print) memiliki batasan WebKit sehingga pengguna disarankan memakai tombol "Unduh PDF" langsung.
     3. Foto dokumentasi tidak dapat diunggah atau diantrekan saat offline (tombol dinonaktifkan secara eksplisit dengan teks bantuan).

---

## 2. Daftar Putih Library & Versi Package

### A. Backend (`api/package.json`) — Standar Modul 1 + Pengecualian Multer 2.x
- `"type": "module"`
- `"scripts"`: `{ "start": "node src/index.js", "dev": "nodemon src/index.js" }`
- `"dependencies"`:
  - `"@supabase/supabase-js": "^2.113.0"`
  - `"cors": "^2.8.5"`
  - `"dotenv": "^17.4.2"`
  - `"express": "^5.2.1"`
  - `"multer": "^2.5.0"` (**Pengecualian Daftar Putih Resmi**: Versi 2.x terbaru `^2.5.0`. Versi 1.x dilarang keras karena memiliki celah keamanan CVE. Digunakan secara khusus untuk menangani stream multipart in-memory `memoryStorage` limit 2 MB dan inspeksi magic bytes buffer sebelum diunggah ke Supabase Storage, tanpa menulis file sementara ke disk serverless Vercel).
- `"devDependencies"`:
  - `"nodemon": "^3.1.14"`
- **DILARANG**: Menambahkan ORM (Prisma, TypeORM, Sequelize), library upload selain multer 2.x, atau middleware berat lainnya.

### B. Frontend (`web/package.json`) — Fondasi Modul 4 + Daftar Putih Ketat
- Dihasilkan dari `npm create vite@latest web -- --template react` (JavaScript murni, tanpa TypeScript).
- Tambahan *dependencies* yang diizinkan HANYA:
  - `axios`
  - `lucide-react`
  - `react-router-dom`
- Tambahan *devDependencies* yang diizinkan HANYA:
  - `vite-plugin-pwa`
  - `@types/react`
  - `@types/react-dom`
  - `@vitejs/plugin-react`
  - `oxlint`
  - `vite`
- **DILARANG KERAS**: Menambahkan Tailwind CSS, Bootstrap, Material UI, Zustand, Redux, React Query, Chart.js, Zod, library kompresi gambar npm (`sharp`, `browser-image-compression`, `canvas`), atau CDN font eksternal. Kompresi gambar proyek pada frontend WAJIB menggunakan Canvas API bawaan browser (`createImageBitmap`).

---

## 3. Struktur Folder Monorepo

```text
partsbin/
├── .gitignore                        # Mengabaikan node_modules, .env*, dist, dev-dist, .vercel, _referensi, folder_acuan
├── README.md                         # Dokumentasi utama, Tabel Bukti Asprak, & Checklist Asistensi
├── agent.md                          # Instruksi kerja & tahapan eksekusi AI Agent (v4.0)
├── arsitektur.md                     # Spesifikasi arsitektur, DB, API, & pola kode (v4.0)
├── design.md                         # Spesifikasi sistem desain Technician's Bench Notebook (v4.0)
├── api/                              # Backend REST API (Vercel Root Directory = api)
│   ├── sql/
│   │   ├── schema.sql                # DDL 4 tabel + index + DISABLE RLS (DROP dikomentari)
│   │   ├── seed.sql                  # Peringatan TRUNCATE + data contoh komponen & proyek
│   │   ├── migration_v4.sql          # Migrasi ALTER TABLE projects & Storage bucket project-images
│   │   └── migration_v5.sql          # Migrasi tabel project_photos (Idempoten v5.0)
│   ├── src/
│   │   ├── config/
│   │   │   └── supabaseClient.js     # Mengekspor instance `supabase` (konvensi Modul 1)
│   │   ├── models/
│   │   │   ├── componentModel.js     # Query CRUD tabel `components`
│   │   │   ├── projectModel.js       # Query CRUD `projects` + nested BOM + status + image
│   │   │   ├── projectItemModel.js   # Query tambah & hapus item di `project_items`
│   │   │   └── projectPhotoModel.js  # Query galeri foto di `project_photos` & cascade storage
│   │   ├── controllers/
│   │   │   ├── componentController.js# Validasi input, guard req.body, & is_low_stock
│   │   │   └── projectController.js  # Validasi status, kalkulator BOM, upload sampul & foto dokumentasi
│   │   ├── routes/
│   │   │   ├── componentRoutes.js    # Definisi endpoint /api/components
│   │   │   └── projectRoutes.js      # Definisi endpoint /api/projects (#8-#19)
│   │   ├── middlewares/
│   │   │   ├── upload.js             # Multer 2.x memoryStorage, limit 2 MB, MIME & magic bytes guard
│   │   │   ├── validateUuid.js       # Validasi format UUID terpusat (:id, :itemId, :photoId)
│   │   │   └── errorHandler.js       # Pemetaan error terpusat (400, 403, 404, 409, 413, 500)
│   │   └── index.js                  # Entry point Express 5, CORS, & registrasi route
│   ├── requests.http                 # Pengujian 19 endpoint positif + skenario negatif
│   ├── vercel.json                   # Konfigurasi serverless Vercel untuk Express
│   ├── .env.example
│   └── package.json
└── web/                              # Frontend PWA (Vercel Root Directory = web)
    ├── public/
    │   ├── icon-192.png              # Ikon PWA 192x192 (purpose: any & maskable)
    │   └── icon-512.png              # Ikon PWA 512x512 (purpose: any & maskable)
    ├── src/
    │   ├── config/
    │   │   ├── api.js                # Axios instance + response interceptor + timeout 30s upload
    │   │   └── profile.js            # Data tunggal STUDENT_PROFILE & APP_INFO
    │   ├── services/
    │   │   ├── componentService.js   # Class singleton pemanggil endpoint /components
    │   │   ├── projectService.js     # Class singleton pemanggil endpoint /projects
    │   │   └── photoService.js       # Service foto dokumentasi terpisah untuk lazy chunk
    │   ├── offline/
    │   │   ├── db.js                 # Pembungkus IndexedDB native (partsbin_db)
    │   │   ├── outbox.js             # Antrean mutasi offline FIFO + validasi + coalescing
    │   │   ├── syncEngine.js         # Engine sinkronisasi FIFO + backoff + Web Locks + BroadcastChannel
    │   │   └── offlineService.js     # Layer orkestrasi mutasi lokal & overlay data
    │   ├── hooks/
    │   │   ├── useComponents.js      # Custom hook daftar & detail komponen (Pola 2 Modul 5)
    │   │   ├── useProjects.js        # Custom hook daftar & detail proyek + invalidasi
    │   │   ├── useOnlineStatus.js    # Sumber status online/offline
    │   │   ├── useTheme.js           # Pengelola tema light/dark di localStorage
    │   │   └── usePagination.js      # Hook pagination client-side (opsi syncUrl)
    │   ├── utils/
    │   │   ├── format.js             # Fungsi formatRupiah(angka)
    │   │   ├── draftStorage.js       # Auto-save draf kalkulator & komponen di localStorage
    │   │   ├── dataCache.js          # In-memory cross-hook cache invalidation
    │   │   ├── bom.js                # Kalkulator rumus BOM terisolasi (live calculation)
    │   │   ├── imageCompress.js      # Kompresi Canvas API (createImageBitmap, max 1024px, target < 200 KB)
    │   │   ├── chunkReload.js        # Utilitas penanganan vite:preloadError dengan pembatas reload 10 detik
    │   │   └── safeOffline.js        # Utilitas wrapper async fail-open timeout 2500ms modul offline
    │   ├── components/
    │   │   ├── modals/
    │   │   │   └── ConfirmModal.jsx        # Dialog konfirmasi (Pola 3 Modul 5)
    │   │   ├── RouteErrorBoundary.jsx      # Boundary error rute pembungkus Suspense dengan tombol pemulihan
    │   │   ├── ComponentInlineForm.jsx     # Form collapsible tambah/edit komponen + draf (dipertahankan)
    │   │   ├── TopBar.jsx            # Header sticky + judul halaman + ThemeToggle
    │   │   ├── BottomNav.jsx         # Navigasi bawah 4 tab (Dashboard, Komponen, Kalkulator, Profil)
    │   │   ├── FilterBar.jsx         # Input search + deretan pill filter kategori/stok/status
    │   │   ├── Pagination.jsx        # Kontrol pagination (44px target, tabular-nums, aria-current)
    │   │   ├── StatusChip.jsx        # Chip status proyek (warna + ikon + teks)
    │   │   ├── ProjectCover.jsx      # Sampul gambar rasio 4:3 + fallback SVG inline (< 1 KB)
    │   │   ├── ProjectGallery.jsx    # Galeri foto dokumentasi proyek (grid 2 kolom rasio 4:3)
    │   │   ├── ProjectGalleryItem.jsx # Subkomponen foto dokumentasi dengan edit caption inline
    │   │   ├── ProjectDocumentPrint.jsx # Dokumen cetak A4 terisolasi (eager image load)
    │   │   ├── ProjectDocumentBom.jsx   # Subkomponen tabel BOM cetak terisolasi
    │   │   ├── ProjectDocumentPrint.css # Stylesheet cetak A4 terisolasi untuk window.print()
    │   │   ├── ProjectStatusChanger.jsx # 3 tombol pengubah status pengerjaan fisik proyek
    │   │   ├── ProjectReadinessCard.jsx # Kartu persentase kesiapan rakit BOM
    │   │   ├── ProjectShoppingCard.jsx  # Kartu defisit daftar belanja komponen
    │   │   ├── PWABadge.jsx          # Banner offline + tombol Install PWA
    │   │   └── ThemeToggle.jsx       # Tombol pengubah mode terang/gelap
    │   ├── pages/
    │   │   ├── DashboardPage.jsx     # Route: / (List semua proyek, filter status pill, kartu 4:3 + pagination)
    │   │   ├── ComponentListPage.jsx # Route: /components (List komponen + stepper stok + pagination)
    │   │   ├── ComponentDetailPage.jsx # Route: /components/:id (Detail spek + used_in_projects)
    │   │   ├── ProjectCreatePage.jsx # Route: /calculator (Alur unified buat proyek + BOM)
    │   │   ├── ProjectDetailPage.jsx # Route: /projects/:id (Detail proyek, cover 4:3, 3 status button, BOM)
    │   │   └── ProfilePage.jsx       # Route: /profile (Profil mahasiswa & info aplikasi)
    │   ├── App.css                   # Styling komponen, token kartu, rasio 4:3, responsive
    │   ├── App.jsx                   # BrowserRouter, Routes 6 rute, TopBar, PWABadge, BottomNav
    │   ├── index.css                 # CSS Variables tema terang/gelap & reset dasar
    │   └── main.jsx
    ├── index.html
    ├── vercel.json                   # Rewrite SPA /(.*) -> /index.html
    ├── vite.config.js                # VitePWA + CacheFirst gambar Supabase + NetworkFirst API
    ├── .env.example
    └── package.json
```

---

## 4. Skema Database PostgreSQL (Supabase) & Storage

Ketiga tabel menonaktifkan RLS (`DISABLE ROW LEVEL SECURITY`) sesuai pola Modul 1.

1. **Tabel `components`**:
   - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `name`: `VARCHAR(120) NOT NULL`
   - `category`: `VARCHAR(50) NOT NULL CHECK (category IN ('MCU', 'Sensor', 'Passive', 'Power', 'Actuator', 'Connector', 'Display'))`
   - `stock`: `INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)`
   - `min_stock`: `INTEGER NOT NULL DEFAULT 2 CHECK (min_stock >= 0)`
   - `unit_price`: `INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0)`
   - `bin_location`: `VARCHAR(40) NOT NULL`
   - `specs`: `TEXT DEFAULT ''`
   - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT now()`

2. **Tabel `projects` (Struktur v4.0)**:
   - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `name`: `VARCHAR(120) NOT NULL`
   - `description`: `TEXT DEFAULT ''`
   - `status`: `VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done'))`
   - `image_path`: `TEXT DEFAULT NULL`
   - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT now()`

3. **Tabel `project_items` (Join Table BOM)**:
   - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `project_id`: `UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
   - `component_id`: `UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT`
   - `quantity_needed`: `INTEGER NOT NULL CHECK (quantity_needed > 0)`
   - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `CONSTRAINT unique_project_component UNIQUE (project_id, component_id)`

4. **Tabel `project_photos` (Dokumentasi Foto Proyek v5.0 - v5.3)**:
   - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `project_id`: `UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
   - `image_path`: `TEXT NOT NULL`
   - `thumb_path`: `TEXT DEFAULT NULL` (ditambahkan via `migration_v5_3.sql` untuk thumbnail)
   - `caption`: `VARCHAR(200) NOT NULL DEFAULT ''`
   - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT now()`
   - Index: `idx_project_photos_project_created ON project_photos (project_id, created_at)`
   - RLS: `DISABLE ROW LEVEL SECURITY`
   - Kuota: Batas 60 foto dikelola di layer aplikasi (`MAX_PHOTOS_PER_PROJECT = 60`). Trigger DB v5.1 dibatalkan via `migration_v5_2.sql` agar arsitektur tetap bersih tanpa trigger.

### Skrip Migrasi SQL Idempoten (`api/sql/migration_v4.sql`)
```sql
-- 1. Tambah kolom status dan image_path pada tabel projects
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
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. Policy RLS storage.objects khusus bucket project-images
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
```

### Keamanan Akses Storage & Pembuktian Client Bersih
- **Model Keamanan**: Backend Express (`api/`) menggunakan `anon` key dengan policy Storage yang dibatasi ketat ke `bucket_id = 'project-images'`. Keamanan mutasi bergantung pada kerahasiaan key di server.
- **Koreksi Arsitektur**: Dilarang mengimpor `@supabase/supabase-js` atau menyematkan Supabase API key di `web/src`. Client browser murni berkomunikasi dengan Express API via Axios JSON dan membaca gambar via URL publik Supabase Storage (`<img>`).
- **Checklist Pembuktian Keamanan Frontend**:
  1. `grep -rniE "supabase" web/src` hanya menghasilkan penyebutan teks nama teknologi pada file profil (`config/profile.js`), tanpa kode client supabase.
  2. `web/dist` hasil build produksi terbukti tidak memuat key atau secret Supabase apa pun.

---

## 5. Spesifikasi 19 Endpoint REST API (`/api`)

Seluruh respons sukses mengembalikan `{ data }` (atau `{ message, data }`) dan seluruh respons gagal mengembalikan `{ error: "Pesan jelas dalam Bahasa Indonesia" }`.

| No | Method | Path | Request Body / Content-Type | Status Sukses | Status Gagal |
| :- | :--- | :--- | :--- | :---: | :---: |
| 1 | `GET` | `/api/health` | - | `200` | - |
| 2 | `GET` | `/api/components` | - | `200` | `500` |
| 3 | `GET` | `/api/components/:id` | - | `200` | `400`, `404` |
| 4 | `POST` | `/api/components` | `{ name, category, stock, min_stock, unit_price, bin_location, specs }` | `201` | `400` |
| 5 | `PUT` | `/api/components/:id` | `{ name, category, stock, min_stock, unit_price, bin_location, specs }` | `200` | `400`, `404` |
| 6 | `PATCH` | `/api/components/:id/stock` | `{ stock }` (integer >= 0) | `200` | `400`, `404` |
| 7 | `DELETE` | `/api/components/:id` | - | `200` | `400`, `404`, `409` |
| 8 | `GET` | `/api/projects` | - | `200` | `500` |
| 9 | `GET` | `/api/projects/:id` | - (Termasuk items, summary BOM, `photo_limit: 60`, & array photos dengan `thumb_path` & `thumb_url`) | `200` | `400`, `404` |
| 10 | `POST` | `/api/projects` | `{ name, description, status?, items? }` (items: array of `{ component_id, quantity_needed }`) | `201` | `400`, `409` |
| 11 | `PUT` | `/api/projects/:id` | `{ name, description }` | `200` | `400`, `404` |
| 12 | `DELETE` | `/api/projects/:id` | - (Hapus cascade DB + best-effort hapus sampul & semua foto di Storage) | `200` | `400`, `404` |
| 13 | `POST` | `/api/projects/:id/items` | `{ component_id, quantity_needed }` (integer > 0) | `201` | `400`, `404`, `409` |
| 14 | `DELETE` | `/api/projects/:id/items/:itemId` | - | `200` | `400`, `404` |
| 15 | `PATCH` | `/api/projects/:id/status` | `{ status }` (wajib enum: `'planned'` \| `'in_progress'` \| `'done'`) | `200` | `400`, `404` |
| 16 | `POST` | `/api/projects/:id/image` | `multipart/form-data`, field: `image` (max 2 MB, JPEG/PNG/WebP) | `200` | `400`, `404`, `413` |
| 17 | `POST` | `/api/projects/:id/photos` | `multipart/form-data`, field: `image` (wajib, max 2 MB) + `thumb` (opsional, max 150 KB) + `caption` (maks 60 foto) | `201` | `400`, `404`, `413` |
| 18 | `PATCH` | `/api/projects/:id/photos/:photoId` | `{ caption }` (teks maksimal 200 karakter) | `200` | `400`, `404` |
| 19 | `DELETE` | `/api/projects/:id/photos/:photoId` | - (Hapus foto dari DB + best-effort hapus berkas di Storage) | `200` | `400`, `404` |

### Aturan Validasi & Error Handling Backend:
1. **Guard Express 5 `req.body`**: Setiap controller tulis (`POST`, `PUT`, `PATCH`) WAJIB diawali dengan `const body = req.body ?? {};`.
2. **Endpoint #10 Multi-Table Insert & Compensating Delete**:
   - Menerima payload: `{ name, description, status = 'planned', items = [] }`.
   - Lakukan insert record proyek ke tabel `projects`.
   - Jika array `items` memiliki elemen, lakukan validasi kelengkapan (`component_id`, integer `quantity_needed > 0`) dan lakukan batch insert ke `project_items`.
   - **Compensating Delete & Logging**: Bila proses insert ke `project_items` gagal:
     - Jalankan compensating delete: `await supabase.from('projects').delete().eq('id', newProject.id)`.
     - Bila compensating delete juga gagal, catat error di log server bersama ID proyek: `console.error('[CRITICAL] Gagal compensating delete proyek yatim ID:', newProject.id, compErr)`.
     - Tetap kembalikan pesan error yang jelas ke client sesuai kode kesalahan (400 atau 409).
3. **Endpoint #15 Validasi Enum Status Proyek**:
   - Memastikan `body.status` terdefinisi dan bernilai salah satu dari: `'planned'`, `'in_progress'`, atau `'done'`. Jika di luar enum tersebut, kembalikan `400 Bad Request`.
4. **Endpoint #16 Middleware Multer 2.x & Validasi Buffer**:
   - Konfigurasi `multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })`.
   - Jika `req.file` tidak ada, kembalikan `400 Bad Request`.
   - Validasi MIME type dan verifikasi *magic bytes* buffer:
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47`
     - WebP: `52 49 46 46` ... `57 45 42 50`
   - Nama berkas dibuat eksklusif oleh server: `projects/${projectId}/${crypto.randomUUID()}.${ext}` (tidak pernah memakai nama dari client).
   - **Urutan Upload Aman**: (1) Unggah berkas baru ke Storage, (2) Perbarui `image_path` di database, (3) Jika update DB sukses, hapus berkas lama secara *best-effort* dengan log peringatan bila gagal, (4) Jika update DB gagal, hapus berkas baru yang belum tersambung.
5. **Endpoint #12 Penghapusan Proyek & Berkas Storage**:
   - Hapus record DB (cascade items). Jika memiliki `image_path`, hapus objek di Storage secara best-effort dengan log.
6. **Pemetaan Kode Error di `errorHandler.js`**:
   - `err instanceof multer.MulterError`:
     - Jika `err.code === 'LIMIT_FILE_SIZE'` -> `413 Payload Too Large` (*"Ukuran berkas gambar melebihi batas 2 MB."*).
     - Error multer lainnya -> `400 Bad Request` (`err.message`).
   - Magic bytes tidak cocok / file kosong -> `400 Bad Request`.
   - `err.isCors` -> `403 Forbidden`.
   - `PGRST116` -> `404 Not Found`.
   - `23503` (Foreign Key): `DELETE` -> `409 Conflict`; lainnya -> `404 Not Found`.
   - `23505` (Unique Constraint) -> `409 Conflict`.
   - Lainnya -> `500 Internal Server Error`.

---

## 6. Rumus Logika Bisnis & Kalkulator BOM

### A. Rumus Kalkulator BOM (`web/src/utils/bom.js` & Backend)
1. **Stok Menipis Komponen (`is_low_stock`)**: `is_low_stock = stock <= min_stock`
2. **Kekurangan per Item BOM (`shortage_qty`)**: `shortage_qty = Math.max(0, quantity_needed - stock_available)`
3. **Persentase Kesiapan Rakit Proyek (`readiness_percent`)**: `readiness_percent = total_items === 0 ? 0 : Math.round((ready_items_count / total_items) * 100)`
4. **Biaya Proyek & Daftar Belanja (`shopping_list`)**:
   - `total_bom_cost = sum(quantity_needed * unit_price)`
   - `missing_cost = sum(shortage_qty * unit_price)`
   - Setiap item dengan `shortage_qty > 0` dimasukkan ke array `summary.shopping_list`.

### B. Metrik Dashboard & Filter Status Proyek
Dashboard v4.0 menampilkan list seluruh proyek secara langsung dengan filter status pills (Semua, Direncanakan, Dikerjakan, Selesai; dengan penghitung live `useMemo`) dan pagination client-side (`pageSize: 6`), TANPA grid StatCard 2x2 dan tanpa daftar stok menipis (fokus katalog proyek meja kerja):
1. **Total Proyek (`Semua`)**: `projects.length`
2. **Proyek Dikerjakan**: `projects.filter(p => p.status === 'in_progress').length`
3. **Proyek Selesai**: `projects.filter(p => p.status === 'done').length`
4. **Proyek Direncanakan**: `projects.filter(p => p.status === 'planned').length`

---

## 7. Pola Modul 5, Utilitas Frontend, & Konfigurasi PWA

### Pola 1: Konfigurasi Axios (`web/src/config/api.js`)
Instance Axios default timeout 10000ms. Khusus pemanggilan endpoint upload gambar, timeout 30000ms dan membiarkan header `Content-Type` kosong agar browser menginjeksi boundary multipart secara otomatis.

### Pola 2: Hook Pagination Client-Side (`web/src/hooks/usePagination.js`)
Menerima opsi `{ syncUrl = true }`.
- Bila `syncUrl: true` (digunakan di Dashboard & ComponentListPage), state halaman terikat dengan URL query `?page=` dan otomatis di-clamp `1..totalPages`.
- Bila `syncUrl: false` (digunakan di ComponentPicker Kalkulator), state halaman dikelola di memori React murni tanpa mengubah URL browser.

### Pola 3: Form Inline & Konfirmasi
- `ComponentInlineForm.jsx` (collapsible di halaman list & detail) dipertahankan dengan draf auto-save `draftStorage.js`.
- Edit nama & deskripsi proyek dilakukan secara inline pada `ProjectDetailPage.jsx`.
- `ConfirmModal.jsx` menangani dialog konfirmasi hapus komponen, proyek, dan item BOM.

### Pola 4: Manajemen Draf Kalkulator & Kompresi Canvas
1. **Draf Kalkulator (`draftStorage.js`)**:
   - Kunci localStorage: `'partsbin_draft_calculator'`.
   - Data tersimpan: `{ name, description, items: [{ component_id, quantity_needed }] }`.
   - Berkas gambar **TIDAK IKUT** disimpan di localStorage.
2. **Kompresi Gambar Canvas API & Rendisi Ganda (`web/src/utils/imageCompress.js`)**:
   - Menggunakan API bawaan `createImageBitmap` dan `HTMLCanvasElement`.
   - `compressImage(file)` (Sampul): Sisi terpanjang maks 1024px, target < 200 KB.
   - `compressWithThumb(file)` (Dokumentasi): Single decode `createImageBitmap` untuk menghasilkan 2 rendisi:
     - Full: maks 1024px, target < 200 KB, WebP/JPEG.
     - Thumb: maks 720px, kualitas adaptif 0.75 > 0.65 > 0.55, target <= 80 KB, WebP/JPEG.
   - Menggunakan `createImageBitmap` dengan opsi `{ imageOrientation: 'from-image' }` untuk menangani orientasi EXIF kamera mobile secara otomatis, dan memanggil `bitmap.close()` di blok `finally` untuk mencegah kebocoran memori perangkat.
3. **Galeri Berhalaman & Viewer Dialog (`web/src/components/ProjectGallery.jsx`)**:
   - Paginasi klien: 12 foto per batch (`PAGE_SIZE = 12`) dengan tombol "Tampilkan 12 lagi".
   - Antrean sekuensial dengan penanganan error jaringan: jeda saat putus dan tombol "Coba lagi unggah yang gagal".
   - Concurrency guard `uploadingRef` mencegah trigger ganda saat input berubah.
   - Penampil foto: native HTML5 `<dialog>` dengan tombol navigasi Prev/Next/Tutup, keyboard Escape, dan backdrop click.
4. **Cetak Dokumen PDF (`pdfExport.js` & `ProjectDocumentPrint.jsx`)**:
   - Render dokumen rapi dengan layout A4, logo, tabel BOM, status, dan grid foto dokumentasi.
   - Unduh PDF biner langsung sekali klik via `jsPDF` lazy-chunk (`exportProjectPdf`), tanpa memicu dialog printer fisik desktop.
   - Opsi cetak fisik browser tetap didukung via `@media print` dan `window.print()` pada tombol "Cetak Dokumen".
5. **Alur Finalisasi Proyek di Kalkulator (Mendukung Offline Penuh)**:
   - *Perubahan Keputusan Sadar*: Tombol Finalisasi **TIDAK LAGI** dinonaktifkan saat offline (`disabled={submitting}`).
   - *Alur Offline-First*:
     - Jika Online: `POST /api/projects` -> jika sukses & ada gambar: `POST /api/projects/:id/image` -> hapus draf -> navigasikan ke detail.
     - Jika Offline: Membuat proyek dengan ID sementara `tmp_*`, disimpan ke store `projects` IndexedDB, diantrekan ke `outbox`, berkas kompresi gambar disimpan di store `blobs` IndexedDB (bukan localStorage), lalu langsung navigasi ke detail proyek lokal dengan penanda status "Menunggu".
     - Saat Online Kembali: Sync Engine otomatis mem-flush `outbox` FIFO, menukar `tmp_*` menjadi ID riil database di `idmap`, lalu mengeksekusi upload gambar dari store `blobs`. Tombol retry di detail tetap siap sedia jika terjadi kegagalan jaringan saat upload.

### Konfigurasi PWA & Offline Caching Gambar (`web/vite.config.js`)
Service Worker Workbox:
1. `NetworkFirst` untuk rute API `/api/` (`partsbin-api-cache`, timeout 5 detik).
2. `CacheFirst` untuk thumbnail Supabase Storage (`partsbin-thumbs`, 400 entri, umur 30 hari, pattern `_t.(webp|jpg|jpeg|png)`).
3. `CacheFirst` untuk gambar utama Supabase Storage bucket `project-images` (`partsbin-images`, 60 entri, umur 30 hari).
4. Tag gambar frontend menyertakan atribut `<img crossOrigin="anonymous">`.

---

## 8. Postur Keamanan & Keterbatasan yang Diketahui

Berikut adalah rekapitulasi audit keamanan dan mitigasi yang diterapkan pada repositori PartsBin:

| ID | Aspek Keamanan & Hipotesis | Hasil Verifikasi Kode | Mitigasi yang Diterapkan | Status Saat Ini |
| :--- | :--- | :---: | :--- | :--- |
| **H1** | API publik tanpa autentikasi pengguna | **Terkonfirmasi** | Tidak menerapkan login/token demi kepatuhan arsitektur Modul 1 dan kemudahan penilaian responsi asisten praktikum. | **Keterbatasan Diketahui** (Lingkup Tugas) |
| **H2** | CORS sebagai batas tunggal akses browser | **Terkonfirmasi** | CORS membatasi origin browser luar (`evil.example` -> 403), ditambahkan header `X-Content-Type-Options: nosniff` dan `Referrer-Policy: no-referrer`. Akses non-browser (curl/script) tetap terbuka. | **Keterbatasan Diketahui** |
| **H3** | RLS dinonaktifkan pada tabel database | **Terkonfirmasi** | RLS di-disable sesuai pola Modul 1. Mitigasi: Supabase key tidak pernah dibocorkan ke frontend client. | **Keterbatasan Diketahui** |
| **H4** | Backend memakai anon key & policy storage public | **Terkonfirmasi** | Policy Storage tidak memiliki batasan per role. Mitigasi: Validasi biner buffer (magic bytes) dilakukan di Express sebelum upload. | **Keterbatasan Diketahui** |
| **H5** | Frontend bersih dari Supabase key dan client | **Terkonfirmasi** | Frontend murni menggunakan Axios JSON ke `/api/*` tanpa dependensi `@supabase/supabase-js`, `.env` diabaikan git, dan riwayat commit bebas key. | **Aman / Sesuai Desain** |
| **H6** | Validasi upload gambar aman & anti-bypass | **Terkonfirmasi** | Memakai `multer.memoryStorage()`, batas 2 MB, magic bytes biner (JPEG, PNG, WebP), nama UUID server, dan rollback storage saat update DB gagal. | **Aman / Sesuai Desain** |
| **H7** | Tidak ada rate limiting; errorHandler aman | **Terkonfirmasi** | Error 500 tidak membocorkan stack trace ke client. Ditambahkan validasi format UUID terpusat (`validateUuid.js`) pada parameter `:id` dan `:itemId`. Rate limiting ditiadakan sesuai larangan middleware berat di praktikum. | **Mitigasi Parsial** |
| **H8** | Resolusi konflik Last-Write-Wins (LWW) tanpa kolom versi | **Terkonfirmasi** | Skema tabel database Modul 1 tidak memiliki kolom versi/timestamp konkurensi. Mutasi offline dieksekusi secara FIFO saat sinkronisasi (last-write-wins). | **Keterbatasan Diketahui** (Pilihan Desain Sederhana) |
| **H9** | Batas kapasitas outbox offline 200 operasi dan kedaluwarsa 30 hari | **Terkonfirmasi** | Kuota outbox dibatasi maksimal 200 entri untuk mencegah kehabisan memori browser (QuotaExceededError). Operasi yang tertahan > 30 hari ditandai kedaluwarsa. | **Mitigasi Diterapkan** |
| **H10** | Batas kuota 60 foto di aplikasi tanpa database trigger | **Terkonfirmasi** | Trigger v5.1 dibatalkan via v5.2 demi menghindari SQLSTATE 23514 generik dan menjaga kesederhanaan skema. Kuota ditegakkan di controller `addPhoto`. Unggahan simultan lintas-perangkat dapat melampaui batas 1-2 foto, namun dampaknya nol terhadap integritas data. | **Pilihan Desain Sadar** (Batas Lunak Sederhana) |

---

## 9. Siklus Update & Ketahanan Chunk (Stale-Chunk Resilience)

Aplikasi menerapkan mitigasi 4 lapis untuk mencegah kendala macet atau blank screen saat transisi update:
1. **Pengecualian Aset pada Rewrite Vercel (`web/vercel.json`)**:
   Rewrite SPA diubah menjadi `"/((?!assets/).*)"` agar permintaan berkas chunk JS lama yang telah dihapus di server mengembalikan HTTP 404 asli, bukan file `index.html` (MIME `text/html`). Hal ini krusial karena browser memberlakukan pemeriksaan MIME ketat pada skrip modul ES (`<script type="module">` dan dynamic `import()`), sehingga respons HTML akan memicu kegagalan modul yang terdeteksi dengan tepat oleh Vite.
2. **Reload Otomatis Terkendali (`web/src/utils/chunkReload.js`)**:
   Event `vite:preloadError` ditangani dengan memicu `window.location.reload()` secara otomatis untuk mengambil HTML dan manifest bundle terbaru dari server/SW. Untuk mencegah loop refresh tanpa henti saat jaringan bermasalah, reload dibatasi maksimal 1 kali dalam rentang 10 detik via cap waktu `sessionStorage`.
3. **Boundary Rute Cadangan (`web/src/components/RouteErrorBoundary.jsx`)**:
   Membungkus `<Suspense>` rute utama untuk menangkap kegagalan render atau impor dinamis komponen rute. Error boundary mereset status error secara otomatis saat pengguna berpindah rute (`resetKey = location.pathname`) serta menyediakan tombol pemulihan interaktif (*"Muat Ulang Halaman"*).
4. **Lapisan Offline Fail-Open (`web/src/utils/safeOffline.js`)**:
   Modul offline dimuat secara dinamis via `import()` demi menjaga anggaran bundle awal. Pemanggilan operasi offline dibungkus dengan batas waktu 2500ms (`withTimeout`) dan mekanisme *fail-open*: bila impor chunk offline gagal atau IndexedDB terkendala, aplikasi langsung jatuh kembali ke pengambilan data API online tanpa menghentikan rendering Dashboard atau Katalog Komponen.


