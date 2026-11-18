# PartsBin — Katalog Komponen Mikro & Kalkulator BOM Proyek Elektronika

**Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) Ganjil 2026**

- **Pembuat**: Robertus William Susanto (`21120124120007`)
- **Program Studi**: Teknik Komputer, Universitas Diponegoro
- **Repositori GitHub**: https://github.com/RobertusWilliamSusanto/partsbin
- **URL Produksi Frontend**: https://partsbin-web.vercel.app
- **URL Produksi Backend API**: https://partsbin-api.vercel.app/api

---

## 1. Deskripsi Aplikasi

PartsBin adalah aplikasi web responsif berbasis React + Vite dan Express 5 + Supabase (PostgreSQL) untuk mengelola inventaris komponen elektronika pribadi (lokasi laci, jumlah stok, stok minimum, harga satuan, dan spesifikasi teknis) yang terintegrasi langsung dengan kalkulator **Bill of Materials (BOM)** proyek elektronika.

Sistem desain menggunakan pendekatan **Technician's Bench Notebook** (*Precision Cobalt Slate*, mode terang/gelap bebas kedip, kontras WCAG AA/AAA >= 4.5:1, permukaan solid bebas beban GPU, dan dual-layout Mobile `< 768px` serta Desktop `>= 768px`).

---

## 2. Fitur Utama & Kalkulator BOM

1. **Dashboard Meja Kerja (`/`)**: Menampilkan 4 kartu statistik (Total Jenis Komponen, Estimasi Nilai Aset Rp, Komponen Stok Menipis, Proyek Siap Rakit 100%), daftar peringatan stok menipis, dan daftar proyek siap rakit 100%.
2. **Katalog Komponen (`/components`) & Detail (`/components/:id`)**:
   - Pencarian & filter kategori + filter "Stok Menipis" secara instan di browser (*client-side filtering*).
   - Stepper koreksi stok cepat `-1 / +1` melalui `PATCH /api/components/:id/stock`.
   - Panel form inline collapsible (`ComponentInlineForm.jsx`) dengan auto-save draf ter-debounce 400ms (`localStorage`) pada mode tambah serta inline edit pada halaman detail.
   - Proteksi `ON DELETE RESTRICT` (`409 Conflict`) bila komponen masih terdaftar pada BOM proyek, lengkap dengan daftar `used_in_projects`.
3. **Proyek BOM (`/projects`), Alur Unified (`/projects/new`), & Detail (`/projects/:id`)**:
   - **Buat Proyek + BOM Sekaligus (`/projects/new` — `ProjectCreatePage.jsx`)**: Isi nama & deskripsi proyek sekaligus pilih beberapa komponen BOM + jumlah kebutuhan dalam satu halaman dengan *live preview* estimasi biaya dan prediksi kesiapan rakit (`POST /api/projects` dilanjutkan paralel `Promise.allSettled` ke `POST /api/projects/:id/items`).
   - **Kalkulator Kesiapan Rakit (*Build Readiness %*) & Daftar Belanja (*Shopping Deficit*)**:
     - `is_low_stock = stock <= min_stock`
     - `shortage_qty = Math.max(0, quantity_needed - stock_available)`
     - `is_enough = shortage_qty === 0`
     - `readiness_percent = total_items === 0 ? 0 : Math.round((ready_items_count / total_items) * 100)`
     - `total_bom_cost = sum(quantity_needed * unit_price)`
     - `missing_cost = sum(shortage_qty * unit_price)`
   - Inline edit informasi proyek, tambah/hapus item BOM, serta konfirmasi hapus destruktif melalui `ConfirmModal.jsx`.
4. **Profil & Tentang (`/profile`)**: Identitas pembuat, kontrol tema terang/gelap, status koneksi jaringan (`useOnlineStatus`), status draf tersimpan, serta ringkasan arsitektur dan rumus BOM.
5. **Sinkronisasi Cache Lintas-Hook (`dataCache.js`)**: Setiap mutasi stok/data komponen otomatis meng-invalidasi cache proyek (agar `readiness_percent` dan `shopping_list` selalu akurat saat pindah tab), dan setiap mutasi proyek/item BOM otomatis meng-invalidasi cache detail komponen (`used_in_projects`).

---

## 3. Arsitektur Sistem & ERD

### Diagram Arsitektur

```mermaid
flowchart LR
  User["Browser / Perangkat Mobile"] --> Web["Frontend React + Vite (web/)"]
  Web --> Cache["In-Memory Cache (dataCache.js) & localStorage"]
  Web -->|"Axios HTTP JSON (/api/*)"| Api["Backend Express 5 (api/)"]
  Api -->|"Supabase JS Client"| DB[("Supabase PostgreSQL")]
```

### Entity Relationship Diagram (3 Tabel)

```mermaid
erDiagram
  components ||--o{ project_items : "ON DELETE RESTRICT"
  projects ||--o{ project_items : "ON DELETE CASCADE"

  components {
    uuid id PK
    varchar name
    varchar category
    int stock
    int min_stock
    int unit_price
    varchar bin_location
    text specs
    timestamptz created_at
  }

  projects {
    uuid id PK
    varchar name
    text description
    timestamptz created_at
  }

  project_items {
    uuid id PK
    uuid project_id FK
    uuid component_id FK
    int quantity_needed
    timestamptz created_at
  }
```

---

## 4. Struktur Folder Monorepo

```text
partsbin/
├── .gitignore
├── README.md
├── api/
│   ├── sql/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── src/
│   │   ├── config/supabaseClient.js
│   │   ├── models/{componentModel.js, projectModel.js, projectItemModel.js}
│   │   ├── controllers/{componentController.js, projectController.js}
│   │   ├── routes/{componentRoutes.js, projectRoutes.js}
│   │   ├── middlewares/errorHandler.js
│   │   └── index.js
│   ├── requests.http
│   ├── vercel.json
│   ├── .env.example
│   └── package.json
└── web/
    ├── src/
    │   ├── config/{api.js, profile.js}
    │   ├── services/{componentService.js, projectService.js}
    │   ├── hooks/{useComponents.js, useProjects.js, useOnlineStatus.js, useTheme.js}
    │   ├── utils/{dataCache.js, draftStorage.js, format.js}
    │   ├── components/
    │   │   ├── modals/ConfirmModal.jsx
    │   │   ├── ComponentInlineForm.jsx
    │   │   ├── TopBar.jsx
    │   │   ├── BottomNav.jsx
    │   │   ├── FilterBar.jsx
    │   │   ├── PWABadge.jsx
    │   │   └── ThemeToggle.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx          (Route: /)
    │   │   ├── ComponentListPage.jsx      (Route: /components)
    │   │   ├── ComponentDetailPage.jsx    (Route: /components/:id)
    │   │   ├── ProjectListPage.jsx        (Route: /projects)
    │   │   ├── ProjectCreatePage.jsx      (Route: /projects/new)
    │   │   ├── ProjectDetailPage.jsx      (Route: /projects/:id)
    │   │   └── ProfilePage.jsx            (Route: /profile)
    │   ├── App.css
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── .env.example
    └── package.json
```

---

## 5. Pemetaan Aturan Wajib Asprak -> Bukti Implementasi

| Aturan Wajib Asprak | Bukti Implementasi di Aplikasi |
| :--- | :--- |
| REST API buatan sendiri sesuai Modul 1 (`supabaseClient.js`, `routes -> controllers -> models`) | `api/src/config/supabaseClient.js`, `api/src/routes/`, `api/src/controllers/`, `api/src/models/`, `api/src/middlewares/errorHandler.js` |
| Navigasi bawah (*Bottom Navigation Bar*, mobile-first) + responsif desktop | `web/src/components/BottomNav.jsx` (tampil `< 768px`), `web/src/components/TopBar.jsx` (navigasi horizontal `>= 768px`), `web/src/App.css` |
| Minimal 5 halaman (tersedia 7 rute halaman) | `web/src/App.jsx`: `/`, `/components`, `/components/:id`, `/projects`, `/projects/new`, `/projects/:id`, `/profile` |
| Minimal 2 halaman *List* yang itemnya bisa diklik ke halaman *Detail* | `ComponentListPage.jsx` -> `ComponentDetailPage.jsx` (`/components/:id`) dan `ProjectListPage.jsx` -> `ProjectDetailPage.jsx` (`/projects/:id`) |
| 1 halaman *Profile/About* | `web/src/pages/ProfilePage.jsx` + data sumber tunggal `web/src/config/profile.js` |
| Pola Modul 5 (Axios interceptor, Service/Hook, `ConfirmModal`, `draftStorage`) | `web/src/config/api.js`, `web/src/services/`, `web/src/hooks/`, `web/src/components/modals/ConfirmModal.jsx`, `web/src/utils/draftStorage.js` |
| Monorepo publik tanpa file `.env` / secret | `.gitignore` mengabaikan `.env` dan `.env.*` (kecuali `!**/.env.example`), terverifikasi lewat `git status` & `git log` |
| Deploy produksi di Vercel (2 project: `api` dan `web`) | Frontend: https://partsbin-web.vercel.app ; Backend: https://partsbin-api.vercel.app/api |

---

## 6. Spesifikasi 14 Endpoint REST API (`/api`)

| No | Method | Path | Sukses | Gagal |
| :- | :--- | :--- | :---: | :---: |
| 1 | `GET` | `/api/health` | `200` | - |
| 2 | `GET` | `/api/components` | `200` | `500` |
| 3 | `GET` | `/api/components/:id` | `200` | `400`, `404` |
| 4 | `POST` | `/api/components` | `201` | `400` |
| 5 | `PUT` | `/api/components/:id` | `200` | `400`, `404` |
| 6 | `PATCH` | `/api/components/:id/stock` | `200` | `400`, `404` |
| 7 | `DELETE` | `/api/components/:id` | `200` | `400`, `404`, `409` |
| 8 | `GET` | `/api/projects` | `200` | `500` |
| 9 | `GET` | `/api/projects/:id` | `200` | `400`, `404` |
| 10 | `POST` | `/api/projects` | `201` | `400` |
| 11 | `PUT` | `/api/projects/:id` | `200` | `400`, `404` |
| 12 | `DELETE` | `/api/projects/:id` | `200` | `400`, `404` |
| 13 | `POST` | `/api/projects/:id/items` | `201` | `400`, `404`, `409` |
| 14 | `DELETE` | `/api/projects/:id/items/:itemId` | `200` | `400`, `404` |

### Contoh Pengujian `curl` (Teks Polos)

```text
curl -s https://partsbin-api.vercel.app/api/health
curl -s https://partsbin-api.vercel.app/api/components
curl -s https://partsbin-api.vercel.app/api/projects
curl -s -X POST http://localhost:3000/api/components
curl -s -X PATCH http://localhost:3000/api/components/UUID_KOMPONEN/stock -H "Content-Type: application/json" -d '{"stock": 10}'
```

---

## 7. Panduan Setup Lokal & Deploy Vercel

### A. Setup Database Supabase
1. Buka Supabase SQL Editor.
2. Jalankan `api/sql/schema.sql` untuk membuat tabel `components`, `projects`, dan `project_items`.
3. (Opsional untuk data awal) Jalankan `api/sql/seed.sql` (perhatikan skrip ini menjalankan `TRUNCATE`).

### B. Menjalankan Backend (`api/`)
1. Salin `api/.env.example` menjadi `api/.env` lalu isi:
   - `PORT=3000`
   - `SUPABASE_URL=https://project-id.supabase.co`
   - `SUPABASE_KEY=supabase-anon-key`
   - `FRONTEND_URL=http://localhost:5173,https://partsbin-web.vercel.app`
2. Jalankan:
   ```text
   cd api
   npm install
   npm run dev
   ```
   Backend berjalan pada http://localhost:3000/api.

### C. Menjalankan Frontend (`web/`)
1. Salin `web/.env.example` menjadi `web/.env` lalu isi:
   - `VITE_API_BASE_URL=http://localhost:3000/api`
2. Jalankan:
   ```text
   cd web
   npm install
   npm run dev
   ```
   Frontend berjalan pada http://localhost:5173.

### D. Deploy 2 Project Vercel dari 1 Monorepo
1. **Project Backend (`partsbin-api`)**:
   - Root Directory: `api`
   - Environment Variables: `SUPABASE_URL`, `SUPABASE_KEY`, `FRONTEND_URL=https://partsbin-web.vercel.app`
   - URL hasil deploy: https://partsbin-api.vercel.app/api
2. **Project Frontend (`partsbin-web`)**:
   - Root Directory: `web`
   - Framework Preset: Vite (`npm run build`, Output Directory: `dist`)
   - Environment Variables: `VITE_API_BASE_URL=https://partsbin-api.vercel.app/api`
   - URL hasil deploy: https://partsbin-web.vercel.app

### E. Uji Preview Produksi & Offline
1. Jalankan `npm run build` lalu `npm run preview -- --host` di dalam folder `web/`.
2. Buka http://localhost:4173 di Chrome/Edge, buka DevTools -> tab **Application** -> **Service Workers** (gunakan tombol **Unregister** bila ingin membersihkan cache pengujian lama) dan uji toggle **Offline** di tab **Network**.

---

## 8. Checklist Asistensi Asprak

- [ ] URL Deploy Frontend aktif: https://partsbin-web.vercel.app
- [ ] URL Deploy Backend aktif: https://partsbin-api.vercel.app/api/health
- [ ] Link Repositori GitHub Public: https://github.com/RobertusWilliamSusanto/partsbin
- [ ] Lembar asistensi siap ditandatangani.
- [ ] **3 Bahan Diskusi Responsi dengan Asisten**:
  1. **Alasan memilih `react-router-dom` (7 rute) dibanding navigasi `useState` Modul 4**: Setiap halaman detail (`/components/:id`, `/projects/:id`) dan form unified (`/projects/new`) memiliki URL unik yang bisa di-bookmark serta mendukung tombol *Back* bawaan perangkat pada mode PWA *standalone*.
  2. **Arsitektur monorepo 2 project Vercel (`api/` dan `web/`)**: Memisahkan siklus deploy backend Express serverless dan frontend static/SPA tanpa memecah riwayat Git, dengan CORS origin whitelist melalui `FRONTEND_URL`.
  3. **Penanganan error Express 5 & guard `req.body ?? {}`**: Express 5 menangkap rejection fungsi `async` secara otomatis ke `errorHandler.js` (memetakan `PGRST116` -> 404, `23503` saat `DELETE` -> 409 `ON DELETE RESTRICT`, `23505` -> 409 duplikat BOM, `22P02` -> 400 UUID tidak valid), sementara `const body = req.body ?? {}` mencegah `TypeError` ketika request `POST`/`PUT`/`PATCH` dikirim tanpa body.
