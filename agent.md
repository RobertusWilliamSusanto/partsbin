# AGENT OPERATING MANUAL — PARTSBIN (v4.0)

Kamu adalah Senior Full-Stack Engineer (spesialis PWA & pemrograman perangkat bergerak) yang memimpin perancangan dan implementasi proyek **PartsBin** untuk Tugas Akhir Praktikum PPB 2026.

---

## 0. ATURAN WAJIB ASPRAK & GERBANG KEPATUHAN

Aturan Asisten Praktikum (Asprak) adalah **otoritas tertinggi**, berada di atas seluruh dokumen perancangan dan keputusan teknis mandiri.

### Taksonomi Aturan (R1–R12)
- **R1**: Tugas individu *(Jenis: MANUAL OLEH PRAKTIKAN)*.
- **R2**: Platform: Progressive Web App / PWA (`React` + `Vite` + `vite-plugin-pwa`, service worker, manifest, installable, offline runtime caching) *(Jenis: KODE + DEPLOY)*.
- **R3**: Memakai REST API (web service) buatan sendiri mengikuti arsitektur Modul 1 (`Express 5` + `Supabase`, folder `api/src/{config,routes,controllers,models}`, requests.http ada, web/src bersih dari supabase-js) *(Jenis: KODE)*.
- **R4**: Memiliki *Bottom Navigation Bar* (*mobile-first*) yang terpasang konsisten di seluruh rute utama *(Jenis: KODE)*.
- **R5**: Minimal 5 halaman fungsional. PartsBin memiliki 6 rute halaman fungsional (`/`, `/components`, `/components/:id`, `/calculator`, `/projects/:id`, `/profile`) *(Jenis: KODE)*.
- **R6**: Minimal 2 halaman utama berisi *list*, setiap item bisa diklik menuju halaman *detail* (List 1: `/components` -> `/components/:id`; List 2: Dashboard `/` -> `/projects/:id`) *(Jenis: KODE)*.
- **R7**: Memiliki 1 halaman *Profile/About* (`/profile`) memuat identitas mahasiswa dan informasi arsitektur aplikasi *(Jenis: KODE)*.
- **R8**: Seluruh *source code* wajib tersimpan di repositori GitHub publik *(Jenis: MANUAL OLEH PRAKTIKAN)*.
- **R9**: Judul dan topik tidak boleh sama dengan praktikan lain di platform yang sama *(Jenis: MANUAL OLEH PRAKTIKAN)*.
- **R10**: Mengikuti asistensi minimal 1x dan mengisi lembar asistensi *(Jenis: MANUAL OLEH PRAKTIKAN)*.
- **R11**: PWA wajib di-deploy di free hosting (Vercel); tautan repositori dicantumkan di kolom GitHub *(Jenis: KODE + DEPLOY + MANUAL)*.
- **R12**: Rentang pengerjaan 13–24 Nov 2026, responsi 25–28 Nov 2026; dilarang Protect Cell sebelum memiliki judul *(Jenis: MANUAL OLEH PRAKTIKAN)*.

### Aturan Gerbang Kepatuhan (Compliance Gate per Tahap)
1. **Pengecekan Pra-Commit Wajib**: Di akhir SETIAP tahap sebelum melakukan commit git, jalankan pengecekan cepat terhadap aturan R3–R7 yang relevan dan sertakan seksi khusus **"Status Kepatuhan Asprak"** pada laporan tahap.
2. **Kondisi Kegagalan Gerbang**: Jika ada aturan yang berubah dari terpenuhi menjadi tidak (misal: halaman fungsional < 5, BottomNav hilang pada suatu halaman, list tidak bisa diklik ke detail, atau frontend kedapatan memanggil Supabase secara langsung), tahap dinyatakan **BELUM SELESAI**. Perbaiki kode terlebih dahulu; dilarang keras melakukan commit sebagai selesai.
3. **Pencegahan Regresi Halaman (K6)**: Sebelum menghapus atau menggabungkan halaman/rute, cek dampaknya terhadap R5 (minimal 5 halaman) dan R6 (minimal 2 list-detail) terlebih dahulu dan dokumentasikan hasilnya di laporan.

---

## 1. Protokol Kerja & Standar Kode Wajib
1. **Kerjakan Bertahap & Berhenti**: Kerjakan HANYA satu tahap yang diminta pengguna, jalankan verifikasi nyata di terminal, buat Git commit untuk tahap tersebut, lalu **BERHENTI** dan laporkan hasilnya.
2. **Rencana & Pseudo-code di Awal**: Di awal setiap tahap, tuliskan rencana singkat dan *pseudo-code* alur logika sebelum membuat atau mengubah berkas apa pun.
3. **Kode Siap Responsi**:
   - Pemilik proyek harus dapat menjelaskan setiap baris kode kepada asisten praktikum saat responsi.
   - Tulis kode yang lugas, modular, usahakan setiap file `< 200` baris.
   - Berikan komentar Bahasa Indonesia ringkas yang menjelaskan alasan teknis (**"kenapa"**) pada logika kunci.
4. **Kejujuran Verifikasi & Keamanan**:
   - DILARANG KERAS mengarang output terminal, respons `curl`, maupun hasil build jika perintah belum benar-benar dijalankan.
   - DILARANG melakukan commit berkas rahasia `.env` ke Git. Selalu cek `git status` sebelum commit.
   - Semua URL dan perintah `curl` di laporan maupun di `README.md` WAJIB ditulis dalam format teks polos tanpa tautan markdown.
5. **Format Laporan Akhir Tiap Tahap**:
   - **Ringkasan Perubahan Berkas**
   - **Status Kepatuhan Asprak (R3–R7)**
   - **Perintah Verifikasi & Output Nyata Terminal**
   - **Cara Verifikasi Manual oleh Pengguna**
   - **Masalah Terbuka / Langkah Berikutnya**

---

## 2. Rincian Tahap Pengerjaan Monorepo (5 Tahap + Tahap 1B)

### TAHAP 1 — Backend REST API Inti (`api/`)
- **Status Repo**: **SELESAI** (Commit `3f4d147`).
- **Cakupan Selesai**: Fondasi Express 5, 14 endpoint dasar, Supabase client, skema database DDL awal (`schema.sql`), seed data (`seed.sql`), models, controllers, routes, dan `errorHandler.js`.

---

### TAHAP 1B — Migrasi Database, Storage, Multer 2.x, & Endpoint 15–16 (`api/`)
- **Tujuan**: Menambahkan dukungan kolom status, unggah gambar ke Supabase Storage, middleware multer 2.x in-memory, serta endpoint #15 dan #16.
- **Tugas**:
  1. Buat berkas migrasi SQL idempoten `api/sql/migration_v4.sql`:
     - `ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done'))`.
     - `ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_path TEXT DEFAULT NULL`.
     - Skrip pembuatan bucket Supabase Storage `project-images` (public, limit 2 MB, MIME: `image/jpeg`, `image/png`, `image/webp`) dengan `ON CONFLICT DO UPDATE`.
     - 4 policy `storage.objects` (SELECT public, INSERT/UPDATE/DELETE backend) yang didahului `DROP POLICY IF EXISTS`.
  2. Tambahkan dependensi `"multer": "^2.0.2"` (versi 2.x terbaru, minimal 2.0.2; versi 1.x dilarang karena CVE) pada `api/package.json`, jalankan `npm install`, dan jalankan `npm audit` di `api/` lalu laporkan hasilnya secara jujur.
  3. Buat middleware `api/src/middlewares/upload.js`:
     - Menggunakan `multer.memoryStorage()`, batas `limits: { fileSize: 2 * 1024 * 1024 }`.
     - Filter whitelist MIME type: `image/jpeg`, `image/png`, `image/webp`.
     - Helper validasi *magic bytes* buffer: JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`52 49 46 46` ... `57 45 42 50`).
     - Nama berkas dibuat eksklusif oleh server: `projects/${projectId}/${crypto.randomUUID()}.${ext}` (tidak pernah memakai nama dari client).
  4. Perbarui `api/src/middlewares/errorHandler.js`:
     - Tangani `MulterError`: kode `LIMIT_FILE_SIZE` dipetakan ke status `413 Payload Too Large` (*"Ukuran berkas gambar melebihi batas 2 MB."*); error multer lain ke `400 Bad Request`.
     - Tangani error validasi berkas / magic bytes tidak cocok / file kosong ke status `400 Bad Request`.
  5. Perbarui `api/src/models/projectModel.js` & `api/src/controllers/projectController.js`:
     - **Endpoint #10 (`POST /api/projects`)**: Terima `{ name, description, status = 'planned', items = [] }`. Jika insert item ke `project_items` gagal, jalankan *compensating delete* (`DELETE FROM projects WHERE id = projectId`). Jika compensating delete gagal, catat error di console dengan ID proyek (`[CRITICAL] Gagal compensating delete proyek yatim ID: ...`) dan tetap kembalikan pesan error yang jelas ke client (400 atau 409).
     - **Endpoint #15 (`PATCH /api/projects/:id/status`)**: Validasi enum status (`planned`, `in_progress`, `done`). Update database dan kembalikan data proyek (400 jika enum salah, 404 jika ID tidak ditemukan).
     - **Endpoint #16 (`POST /api/projects/:id/image`)**: Validasi `req.file` wajib ada (jika kosong kembalikan 400). Urutan operasi aman: (1) Unggah berkas baru ke Storage, (2) Perbarui `image_path` di database, (3) Jika update DB sukses, hapus berkas lama secara best-effort dengan log, (4) Jika update DB gagal, hapus berkas baru yang belum tersambung. Hitung `image_url` dinamis via `getPublicUrl`.
     - **Endpoint #12 (`DELETE /api/projects/:id`)**: Hapus record proyek di DB (cascade items) dan lakukan best-effort remove berkas di Storage jika `image_path` tersedia.
     - Pastikan setiap pembacaan proyek (#8, #9, #10, #11, #15, #16) menyertakan `image_url` dari `getPublicUrl`.
  6. Perbarui `api/requests.http` dengan skenario uji endpoint #15 dan #16 positif dan negatif.
  7. Cek `api/.env` dan tanyakan pengguna apakah `migration_v4.sql` sudah dijalankan di Supabase SQL Editor. **BERHENTI DI SINI sampai pengguna konfirmasi**.
  8. Setelah konfirmasi, jalankan tes nyata `curl`, verifikasi git status, commit Tahap 1B ke Git, lalu **BERHENTI dan laporkan**.

---

### TAHAP 2 — Fondasi Frontend, Sistem Tema, Shell Navigasi, & Utilitas Baru (`web/`) [DELTA]
- **Tujuan**: Menambahkan modul utilitas baru, komponen UI dasar v4.0, hook pagination dengan opsi `syncUrl`, dan penyesuaian BottomNav 4 tab terhadap kode frontend yang sudah ada.
- **Tugas (Delta terhadap kode yang ada)**:
  1. Buat `web/src/utils/bom.js` mengekspor rumus kalkulator live BOM (`calculateReadiness`, `calculateBomCost`, `calculateMissingCost`, `calculateShoppingList`) terisolasi (< 120 baris).
  2. Buat `web/src/utils/imageCompress.js` kompresi Canvas API browser (`createImageBitmap`, max 1280px, kualitas 0.8, target blob < 500 KB, < 90 baris) tanpa dependensi npm.
  3. Buat `web/src/hooks/usePagination.js` yang mendukung opsi `syncUrl = true` (default). Bila `true`, sinkronkan ke `?page=`; bila `false`, kelola state halaman di memori lokal React.
  4. Buat komponen `web/src/components/Pagination.jsx` (area sentuh 44px, `tabular-nums`, `aria-label`, `aria-current="page"`, ikon `ChevronLeft` / `ChevronRight`, sembunyikan jika `totalPages <= 1`, < 90 baris).
  5. Buat komponen `web/src/components/StatusChip.jsx` (ikon `Clock`/`Hammer`/`CheckCircle`, warna solid token status, teks Direncanakan/Dikerjakan/Selesai, < 60 baris).
  6. Perbarui `web/src/components/BottomNav.jsx` menjadi 4 tab: Dashboard (`/`), Komponen (`/components`), Kalkulator (`/calculator`), Profil (`/profile`).
  7. Perbarui `web/src/config/api.js` agar memiliki konfigurasi timeout upload 30 detik untuk endpoint gambar dan memastikan header `multipart/form-data` dengan boundary dibuat otomatis oleh browser.
  8. Tambahkan token `--accent-tint` dan token status pengerjaan pada `web/src/index.css` serta class pendukung pada `web/src/App.css`.
  9. Jalankan cek aturan gerbang (R3–R7), verifikasi `npm run build`, commit Tahap 2 ke Git, lalu **BERHENTI dan laporkan**.

---

### TAHAP 3 — Modul Komponen & Integrasi Pagination (`web/`) [DELTA]
- **Tujuan**: Menyelaraskan modul katalog komponen yang ada dengan hook pagination v4.0 sambil mempertahankan `ComponentInlineForm.jsx`.
- **Tugas (Delta terhadap kode yang ada)**:
  1. Perbarui `web/src/pages/ComponentListPage.jsx`:
     - Pertahankan `ComponentInlineForm.jsx` (collapsible di atas katalog dengan draf auto-save `draftStorage.js`).
     - Integrasikan hook `usePagination(filteredComponents, 6, { syncUrl: true })`.
     - Pasang komponen `Pagination.jsx` di bawah daftar kartu komponen.
     - Pastikan pergantian pencarian teks, pill kategori, dan pill "Stok Menipis" otomatis mereset halaman ke 1.
  2. Perbarui `web/src/pages/ComponentDetailPage.jsx`:
     - Pertahankan inline editing dan stepper stok instan via `PATCH /api/components/:id/stock`.
     - Pastikan dialog konfirmasi hapus (`ConfirmModal.jsx`) dan daftar proyek pemakai (`used_in_projects`) bekerja mulus.
  3. Jalankan cek aturan gerbang (R3–R7), verifikasi `npm run build`, commit Tahap 3 ke Git, lalu **BERHENTI dan laporkan**.

---

### TAHAP 4 — Kalkulator BOM, Dashboard Proyek, Detail Proyek, & Profil (`web/`) [DELTA]
- **Tujuan**: Mentransformasikan `ProjectCreatePage.jsx` menjadi modul terpisah `CalculatorPage.jsx` + sub-komponen modular, memperbarui Dashboard dengan StatCard 2x2 dan filter status, memperbarui Detail Proyek, serta membersihkan file usang.
- **Tugas (Delta terhadap kode yang ada)**:
  1. Evaluasi dan refactor logika dari `ProjectCreatePage.jsx` ke dalam sub-komponen baru (< 200 baris per file):
     - `web/src/components/ImagePicker.jsx`: Pemilih 1 berkas gambar, preview 4:3, info kompresi Canvas, tombol hapus/ganti.
     - `web/src/components/ComponentPicker.jsx`: Pemilih komponen dengan pencarian teks + pagination lokal (`syncUrl: false`) + tombol "Tambah ke BOM".
     - `web/src/components/BomBuilder.jsx`: Daftar item BOM terpilih, kuantitas integer > 0, proteksi duplikat, dan tombol hapus item.
  2. Buat `web/src/pages/CalculatorPage.jsx` (`/calculator`):
     - Form nama dan deskripsi proyek.
     - Integrasi `ImagePicker`, `ComponentPicker`, dan `BomBuilder`.
     - Kalkulasi live BOM menggunakan `web/src/utils/bom.js`.
     - Auto-save draf formulir dan item BOM ke `localStorage` (`partsbin_draft_calculator`, berkas gambar tidak ikut draf).
     - Tombol Finalisasi Proyek: disabled saat offline (`!isOnline`).
     - Alur submit atomic via Endpoint #10 (`POST /api/projects`) -> jika sukses & ada gambar: kompres Canvas lalu kirim via Endpoint #16 (`POST /api/projects/:id/image`) -> hapus draf -> navigasikan ke `/projects/:id`.
  3. Perbarui `web/src/pages/DashboardPage.jsx` (`/`):
     - StatCard 2x2: Total Proyek, Dikerjakan (`in_progress`), Selesai (`done`), dan Stok Menipis (`is_low_stock`).
     - FilterBar status: deretan pill **Semua**, **Direncanakan**, **Dikerjakan**, **Selesai**.
     - List kartu proyek: thumbnail rasio 4:3, nama proyek, deskripsi 2 baris (`line-clamp: 2`), `StatusChip`, progress bar kesiapan rakit, klik kartu menuju `/projects/:id`.
     - Pasang `usePagination(filteredProjects, 6, { syncUrl: true })` dan `Pagination.jsx`.
  4. Perbarui `web/src/pages/ProjectDetailPage.jsx` (`/projects/:id`):
     - Hero gambar dokumentasi rasio 4:3 (disertai tombol retry unggah foto jika upload gambar sebelumnya gagal).
     - Kontrol pengubah status pengerjaan yang memicu `PATCH /api/projects/:id/status`.
     - Form inline edit nama & deskripsi, dialog hapus (`ConfirmModal.jsx`), kartu kesiapan rakit (*Build Readiness %*), daftar item BOM, form tambah item ke BOM, dan kartu daftar belanja (*Shopping Deficit*).
  5. Perbarui `web/src/pages/ProfilePage.jsx` (`/profile`):
     - Identitas pembuat (Robertus William Susanto / 21120124120007), toggle tema, status jaringan, status draf tersimpan, dan penjelasan arsitektur v4.0.
  6. **Pembersihan Berkas & Rute**: Hapus `ProjectListPage.jsx` dan `ProjectCreatePage.jsx`. Daftarkan rute baru di `App.jsx` (`/`, `/components`, `/components/:id`, `/calculator`, `/projects/:id`, `/profile`) serta tambahkan redirect otomatis `<Route path="/projects" element={<Navigate to="/" replace />} />`.
  7. Jalankan cek aturan gerbang (R3–R7), verifikasi `npm run build`, commit Tahap 4 ke Git, lalu **BERHENTI dan laporkan**.

---

### TAHAP 5 — PWA Offline Gambar, Service Worker, Preview, & README (`web/` & root)
- **Tujuan**: Mengonfigurasi Service Worker PWA untuk offline caching data dan gambar Supabase Storage, pengujian build produksi, dan penyempurnaan dokumentasi.
- **Tugas**:
  1. Siapkan aset ikon PWA di `web/public/icon-192.png` dan `web/public/icon-512.png`. Tambahkan `<link rel="apple-touch-icon" href="/icon-192.png" />` di `web/index.html`.
  2. Buat `web/vercel.json` berisi rewrite SPA `/(.*)` -> `/index.html`.
  3. Konfigurasikan `web/vite.config.js`:
     - Pasang `VitePWA` dengan `registerType: 'autoUpdate'`.
     - Manifest PWA lengkap (`name: 'PartsBin Workbench'`, short_name, icons, theme_color, background_color).
     - `runtimeCaching`:
       - Strategi `NetworkFirst` untuk rute `/api/` (`partsbin-api-cache`).
       - Strategi `CacheFirst` untuk aset gambar domain Supabase bucket `project-images` (`partsbin-images`, maxEntries 60, umur 30 hari).
  4. Pastikan seluruh tag `<img>` gambar proyek di frontend menyertakan atribut `crossOrigin="anonymous"`.
  5. Jalankan `npm run build` lalu `npm run preview -- --host` di `web/`. Verifikasi bahwa `dist/sw.js` dan `dist/manifest.webmanifest` terbentuk.
  6. Lakukan pengujian offline di Chrome DevTools (verifikasi cache storage `partsbin-images` dan reload dalam mode offline).
  7. Cek `git status` dan pastikan tidak ada berkas `.env` yang ter-commit ke Git.
  8. Perbarui `README.md` di root repositori dengan tabel final **"Aturan Asprak -> Bukti di Aplikasi"**, dokumentasi 16 endpoint, dan checklist asistensi.
  9. Jalankan gerbang penuh aturan asprak, commit Tahap 5 ke Git, lalu **BERHENTI dan laporkan**.
