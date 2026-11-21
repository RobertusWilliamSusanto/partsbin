# DESIGN SYSTEM — PARTSBIN ("TECHNICIAN'S BENCH NOTEBOOK" v4.0)

Seluruh antarmuka frontend PartsBin (`web/`) WAJIB mematuhi spesifikasi desain ini. Pertahankan nama class dasar Modul 4 (`.shell`, `.main`, `.masthead`, `.page`, `.display`, `.lede`, `.list-head`, `.count`, `.stock`, `.card`) dengan menerapkan token visual, komponen baru, dan aturan antarmuka versi 4.0 di bawah ini.

---

## 1. Prinsip Estetika & Larangan Visual Keras
- **Karakter Visual**: Buku catatan meja kerja teknisi elektronika (*Technician's Bench Notebook*) — bersih, kontras tinggi, warna solid, hierarki angka/kode presisi, hemat daya render GPU mobile, dan bebas dekorasi semu.
- **DILARANG KERAS**:
  1. Segala jenis `gradient` (`linear-gradient`, `radial-gradient`, `conic-gradient`) pada tombol, latar belakang, kartu, area gambar, maupun progress bar.
  2. Efek `glow`, `neon`, `text-shadow`, atau `box-shadow` berwarna selain bayangan netral token `--shadow-1`.
  3. Ornamen blob/orb di latar belakang, animasi *shimmer/skeleton kedip-kedip*, atau palet ungu-biru ala template generator AI.
  4. Penggunaan karakter emoji sebagai pengganti ikon UI (wajib gunakan komponen ikon `lucide-react` dengan `strokeWidth={1.75}` atau `2` dan ukuran terstandarisasi).
  5. Memuat font eksternal dari Google Fonts / CDN (wajib *system font stack* agar rendering instan dan bekerja 100% saat *offline*).

---

## 2. Token Warna & Tema (`web/src/index.css`)

Menggunakan palet **Precision Cobalt Slate** yang lulus uji kontras WCAG 2.1 AA/AAA (`>= 4.5:1` untuk seluruh pasangan teks dan `>= 3:1` untuk komponen antarmuka) baik pada mode terang maupun mode gelap.

```css
:root,
html[data-theme='light'] {
  color-scheme: light;
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-2: #f1f5f9;
  --text: #0f172a;
  --text-muted: #475569;
  --border: #cbd5e1;
  --border-strong: #64748b;
  --accent: #1d4ed8;
  --accent-contrast: #ffffff;
  --accent-tint: #dbeafe;
  --ok: #15803d;
  --ok-tint: #dcfce7;
  --warn: #b45309;
  --warn-tint: #fef3c7;
  --danger: #b91c1c;
  --danger-tint: #fee2e2;
  --glass-bg: rgba(255, 255, 255, 0.86);
  --glass-border: rgba(15, 23, 42, 0.12);
  --shadow-1: 0 1px 3px rgba(15, 23, 42, 0.06);

  /* Status Progres Proyek */
  --status-planned: #475569;
  --status-planned-bg: #f1f5f9;
  --status-progress: #1d4ed8;
  --status-progress-bg: #eff6ff;
  --status-done: #15803d;
  --status-done-bg: #dcfce7;

  /* Alias kompatibilitas class Modul 4 */
  --paper: var(--bg);
  --ink: var(--text);
  --steel: var(--text-muted);
  --brass: var(--accent);
  --line: var(--border);
  --panel: var(--surface-2);
  --panel-text: var(--text);
}

html[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0b0f17;
  --surface: #111827;
  --surface-2: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --border: #334155;
  --border-strong: #64748b;
  --accent: #60a5fa;
  --accent-contrast: #0b0f17;
  --accent-tint: #172554;
  --ok: #4ade80;
  --ok-tint: #052e16;
  --warn: #fbbf24;
  --warn-tint: #451a03;
  --danger: #f87171;
  --danger-tint: #450a0a;
  --glass-bg: rgba(17, 24, 39, 0.86);
  --glass-border: rgba(241, 245, 249, 0.12);
  --shadow-1: none;

  /* Status Progres Proyek */
  --status-planned: #94a3b8;
  --status-planned-bg: #1e293b;
  --status-progress: #60a5fa;
  --status-progress-bg: #172554;
  --status-done: #4ade80;
  --status-done-bg: #052e16;
}
```

### Tabel Rasio Kontras WCAG 2.1 (Hasil Skrip Uji Nyata)
| Pasangan Elemen | Tema Terang | Tema Gelap | Status |
| :--- | :--- | :--- | :---: |
| `text` di atas `bg` | `#0f172a` / `#f8fafc` (17.06:1) | `#f1f5f9` / `#0b0f17` (17.51:1) | AAA |
| `text` di atas `surface` | `#0f172a` / `#ffffff` (17.85:1) | `#f1f5f9` / `#111827` (16.19:1) | AAA |
| `text-muted` di atas `surface` | `#475569` / `#ffffff` (7.58:1) | `#94a3b8` / `#111827` (6.92:1) | AA |
| `accent-contrast` di atas `accent` | `#ffffff` / `#1d4ed8` (6.70:1) | `#0b0f17` / `#60a5fa` (7.54:1) | AA |
| `accent` di atas `accent-tint` | `#1d4ed8` / `#dbeafe` (5.49:1) | `#60a5fa` / `#172554` (5.78:1) | AA |
| Chip `ok` di atas `ok-tint` | `#15803d` / `#dcfce7` (4.57:1) | `#4ade80` / `#052e16` (8.55:1) | AA |
| Chip `warn` di atas `warn-tint` | `#b45309` / `#fef3c7` (4.51:1) | `#fbbf24` / `#451a03` (8.97:1) | AA |
| Chip `danger` di atas `danger-tint` | `#b91c1c` / `#fee2e2` (5.30:1) | `#f87171` / `#450a0a` (5.84:1) | AA |
| Chip `planned` di atas `planned-bg` | `#475569` / `#f1f5f9` (6.92:1) | `#94a3b8` / `#1e293b` (5.71:1) | AA |
| Chip `in_progress` di atas `progress-bg` | `#1d4ed8` / `#eff6ff` (6.16:1) | `#60a5fa` / `#172554` (5.78:1) | AA |
| Chip `done` di atas `done-bg` | `#15803d` / `#dcfce7` (4.57:1) | `#4ade80` / `#052e16` (8.55:1) | AA |
| **Kontras Non-Teks (WCAG 1.4.11 >= 3:1)** | | | |
| `border-strong` kontrol interaktif vs `surface` | `#64748b` / `#ffffff` (4.76:1) | `#64748b` / `#111827` (3.73:1) | PASS (>= 3:1) |
| `border-strong` kontrol interaktif vs `bg` | `#64748b` / `#f8fafc` (4.55:1) | `#64748b` / `#0b0f17` (4.03:1) | PASS (>= 3:1) |
| Focus ring `accent` vs `surface` | `#1d4ed8` / `#ffffff` (6.70:1) | `#60a5fa` / `#111827` (6.98:1) | PASS (>= 3:1) |
| Focus ring `accent` vs `bg` | `#1d4ed8` / `#f8fafc` (6.41:1) | `#60a5fa` / `#0b0f17` (7.54:1) | PASS (>= 3:1) |

---

## 3. Tipografi, Ukuran, & Layout Mobile-First
- **Font Family**:
  - Teks & Heading: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
  - Kode Laci (`bin_location`), NIM, & Kode Item (`.mono-badge`): `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
- **Skala Font**: `12px` (`0.75rem`), `14px` (`0.875rem`), `16px` (`1rem`), `20px` (`1.25rem`), `24px` (`1.5rem`), `32px` (`2rem`).
- **Angka Tabular**: Harga Rupiah, jumlah stok, angka halaman pagination, persentase readiness, dan nilai stepper wajib memakai `font-variant-numeric: tabular-nums`.
- **Target Sentuh & Spasi Aksesibel**:
  - Spasi berbasis kelipatan `4px` (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
  - Radius sudut: `8px` (tombol, input, chip, thumbnail kartu), `12px` (kartu container, hero image), `16px` (modal box), `9999px` (pill filter & progress bar).
  - Garis batas solid: `1px solid var(--border)`.
  - **Aturan Target Sentuh Minimum**: Seluruh elemen interaktif (tombol, tab BottomNav, tombol pagination, stepper `-`/`+`, pill filter, tombol retry gambar) WAJIB memiliki ukuran target sentuh minimal `min-height: 44px` dan `min-width: 44px`.
- **Layout Utama Mobile-First Konsisten (Semua Lebar Layar)**:
  - Seluruh layar (mobile, tablet, maupun layar desktop meja kerja) menggunakan container seragam terpusat `max-width: 480px` (`margin: 0 auto`), `min-height: 100dvh`, dengan `padding: 0 16px calc(84px + env(safe-area-inset-bottom))`.
  - Bottom Navigation Bar (4 tab: Dashboard, Komponen, Kalkulator, Profil) terpasang aktif di SELURUH lebar layar tanpa disembunyikan oleh breakpoint desktop, menjamin aturan R4 terbukti di laptop asisten praktikum.
  - Komponen sampul dokumentasi (`ProjectCover`) menerapkan rasio aspek kaku `4:3`, `object-fit: cover`, dan fallback SVG siluet sirkuit monokrom `currentColor` (<= 1 KB, bebas gradient/filter).
  - Kontrol pengubah status fisik 3 tombol (`.status-selector`, `.status-btn`) memenuhi target sentuh aksesibel `min-height: 44px` dan `min-width: 44px` dengan atribut `aria-pressed="true"`.
- **Motion**: Transisi halus `150ms ease` hanya pada `color`, `background-color`, `border-color`, `transform`, dan `opacity`. Wajib menyertakan media query `@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`.

---

## 4. Aturan Glassmorphism Terbatas
- Class `.glass` **HANYA BOLEH** digunakan pada elemen navigasi/melayang di atas viewport: `.top-bar`, `.bottom-nav`, `.modal-box`, `.toast`, dan `.pwa-badge` (maksimal 3 lapisan bersamaan).
- Seluruh `.card`, thumbnail gambar, dan form input wajib menggunakan warna permukaan solid (`var(--surface)` atau `var(--surface-2)`).

---

## 5. Mode Terang / Gelap Bebas Kedip (No-Flash)
1. Di `web/index.html`, pasang dua meta `theme-color` (`#f8fafc` untuk light, `#0b0f17` untuk dark) dan skrip inline kecil di `<head>` yang membaca `localStorage.getItem('partsbin_theme')` atau `prefers-color-scheme`, lalu mengeset atribut `data-theme="light|dark"` pada `document.documentElement` sebelum React me-render virtual DOM.
2. Sediakan `web/src/hooks/useTheme.js` dan `web/src/components/ThemeToggle.jsx` yang dipasang pada `TopBar.jsx`.

---

## 6. Spesifikasi Komponen & Sistem Kartu

### A. Komponen Pagination (`web/src/components/Pagination.jsx`)
- Kontrol navigasi halaman kompak di bawah daftar item.
- Struktur: Tombol *Previous* (`ChevronLeft`), deretan tombol angka halaman, dan tombol *Next* (`ChevronRight`).
- **Dimensi**: Setiap tombol memiliki ukuran minimal `44px x 44px` (`min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`).
- **Aksesibilitas**:
  - Tombol halaman aktif ditandai atribut `aria-current="page"` dan class `.pagination__btn--active` (latar `var(--accent)`, teks `var(--accent-contrast)`).
  - Seluruh tombol diberi `aria-label` deskriptif (misal: `aria-label="Halaman sebelumnya"`, `aria-label="Ke halaman 2"`).
  - Teks angka menggunakan `font-variant-numeric: tabular-nums`.
- **State Dinamis**: Tombol navigasi Previous/Next dinonaktifkan (`disabled`) saat berada di batas awal/akhir dengan penurunan opacity `0.4` dan `cursor: not-allowed`.
- **Aturan DOM**: Komponen WAJIB disembunyikan sepenuhnya dari layar jika `totalPages <= 1` (`if (totalPages <= 1) return null;`).

### B. Komponen StatusChip Proyek (`web/src/components/StatusChip.jsx`)
Format wajib: **Warna Solid + Ikon Lucide + Teks Jelas**.

| Status | Teks Tampilan | Ikon (`lucide-react`) | Warna Teks / Aksen | Warna Latar Permukaan |
| :--- | :--- | :--- | :--- | :--- |
| `planned` | `Direncanakan` | `Clock` (`size={14}`) | `var(--status-planned)` | `var(--status-planned-bg)` |
| `in_progress` | `Dikerjakan` | `Hammer` (`size={14}`) | `var(--status-progress)` | `var(--status-progress-bg)` (border 1px `var(--accent)`) |
| `done` | `Selesai` | `CheckCircle` (`size={14}`) | `var(--status-done)` | `var(--status-done-bg)` |

*Pembedaan Tegas*: Ikon `StatusChip` proyek (`Clock`, `Hammer`, `CheckCircle`) TIDAK BOLEH menggunakan ikon yang sama dengan chip ketersediaan stok komponen (`CheckCircle2` untuk stok cukup, `AlertTriangle` untuk stok menipis, dan `AlertCircle` untuk kekurangan stok).

### C. Spesifikasi Area Gambar Proyek & Thumbnail
- **Rasio Aspek Konsisten**: Wajib menggunakan `aspect-ratio: 4 / 3; width: 100%;`.
- **Warna Latar**: Permukaan netral `var(--surface-2)`.
- **Perlakuan Objek**: `object-fit: cover; border-radius: 8px;`.
- **Placeholder Statis (Tanpa Gambar)**: Bila proyek belum memiliki gambar, tampilkan kontainer rasio 4:3 dengan latar `var(--surface-2)`, garis batas `1px dashed var(--border)`, dan ikon terpusat `ImageIcon` (`lucide-react`, `size={32}`, warna `var(--text-muted)`) disertai teks kecil *"Belum ada foto proyek"*.
- **Kompresi Canvas Mobile**: Maksimal sisi terpanjang `1024px`, loop kualitas `0.8 > 0.7 > 0.6`, target berkas `< 200 KB` (mencoba format WebP dengan fallback JPEG, `createImageBitmap` orientasi otomatis EXIF `from-image`).
- **Larangan Skeleton / Shimmer**: Dilarang menggunakan animasi gradasi kedip-kedip (*shimmer skeleton*). Gunakan tampilan statis solid untuk meminimalkan beban komputasi CPU/GPU perangkat bergerak.

### D. Form Inline Komponen (`ComponentInlineForm.jsx`)
- Panel form collapsible yang tersemat rapi di atas katalog atau di dalam detail komponen.
- Menghilangkan modal pop-up yang berat di perangkat bergerak, dilengkapi draf auto-save `draftStorage.js` (`partsbin_draft_component`), validasi instan, dan tombol pembatalan.

### E. State Loading, Empty, & Error Statis
- **Loading State**: Teks minimalis berbobot medium `"Memuat data..."` dengan spinner CSS lingkaran statis berputar halus (1 warna netral `var(--text-muted)`). Dilarang skeleton shimmer abu-abu berkilau.
- **Empty State**: Kotak bergaris batas putus-putus (`1px dashed var(--border)`), padding lapang 24px, memuat ikon lucide bertema inventaris (`PackageOpen`, `FolderSearch`, atau `Layers`), teks judul informatif, deskripsi instruktif, dan tombol aksi pemulihan.
- **Error State**: Banner pesan berlatar `var(--danger-tint)` dengan border `1px solid var(--danger)` dan teks peringatan kontras warna `var(--danger)`, dilengkapi tombol *"Coba Lagi"* (`retry`).

---

## 7. Wireframe 6 Rute Halaman Aplikasi

1. **`DashboardPage` (`/`)**: TopBar -> Header Ringkasan & FilterBar Status Proyek (Semua n | Direncanakan n | Dikerjakan n | Selesai n, sinkron `?status=`) -> List Kartu Proyek (Thumbnail ProjectCover 4:3, Nama Proyek, Deskripsi 2 baris `line-clamp: 2`, StatusChip, Readiness Bar & %, link klik ke `/projects/:id`) -> `Pagination` (sinkron URL `?page=`).
2. **`ComponentListPage` (`/components`)**: TopBar (tombol `+ Tambah`) -> `ComponentInlineForm.jsx` (collapsible) -> FilterBar (Search + Kategori + Stok Menipis) -> List Kartu Komponen (Nama, Laci monospace, Harga, Chip Cukup/Menipis, Stepper Stok) -> `Pagination` (sinkron URL `?page=`).
3. **`ComponentDetailPage` (`/components/:id`)**: TopBar (Back button) -> Kartu Spesifikasi Lengkap -> Stepper Stok -> Form Inline Edit Spek -> Tombol Hapus (`ConfirmModal`) -> Daftar Proyek Pemakai (`used_in_projects`).
4. **`CalculatorPage` (`/calculator`)**: TopBar -> Form Info Proyek -> `ImagePicker` (Upload gambar, preview 4:3, info kompresi Canvas) -> Form Tambah Item BOM (Dropdown select komponen dengan kelompok `<optgroup>` per kategori, input kuantitas kebutuhan, tombol Tambah ke BOM) -> `BomBuilder` (Daftar item BOM terpilih, qty > 0, proteksi duplikat, tombol hapus item) -> Live Summary BOM (Readiness bar %, Total Biaya Rp, Estimasi Kekurangan Biaya Rp, status auto-save draf) -> Tombol Finalisasi Proyek (*"Finalisasi & Simpan Proyek"*, disabled saat offline).
5. **`ProjectDetailPage` (`/projects/:id`)**: TopBar (Back button) -> Hero Proyek (Gambar 4:3 dengan tombol retry upload jika ada gambar lokal gagal, Nama, Deskripsi, Selector Status Proyek yang memicu PATCH status) -> Form Inline Edit Nama & Deskripsi -> Tombol Hapus (`ConfirmModal`) -> Kartu Kesiapan Rakit (Build Readiness %) -> Daftar Item BOM (Nama klik ke komponen, Stok vs Kebutuhan, Chip Cukup/Kurang, tombol hapus item) -> Form Tambah Komponen ke BOM -> Kartu Daftar Belanja (Shopping Deficit).
6. **`ProfilePage` (`/profile`)**: TopBar -> Seksi 1: Identitas Pembuat (`STUDENT_PROFILE`: Robertus William Susanto / `21120124120007`), Theme Toggle, Status Online/Offline, Status Draf Kalkulator -> Seksi 2: Tentang Aplikasi (`APP_INFO`: nama, versi 4.0, penjelasan rumus BOM & pemisahan status proyek vs readiness).

---

## 8. Checklist Verifikasi Desain (Definition of Done)
1. `grep -rniE "gradient|glow|neon|text-shadow" web/src` menghasilkan output kosong (0 baris).
2. `backdrop-filter` HANYA digunakan pada elemen dengan class `.glass`.
3. `box-shadow` HANYA menggunakan token netral `var(--shadow-1)`.
4. Seluruh elemen interaktif (tombol, tab, pagination, stepper) terbukti memiliki area sentuh minimal 44x44px.
5. Uji kontras membuktikan rasio kontras warna teks dan status chip `>= 4.5:1` di kedua mode tema.
6. Seluruh nama ikon lucide terbukti valid dan lulus uji build `npm run build`.
