# DESIGN SYSTEM — PARTSBIN ("iOS BENCH GLASS" v5.1 FINAL)

Seluruh antarmuka frontend PartsBin (`web/`) WAJIB mematuhi spesifikasi desain ini dengan tetap tunduk mutlak pada aturan wajib Asprak (`R1–R12`) dan batasan teknis di `arsitektur.md`. Pertahankan nama class dasar Modul 4 (`.shell`, `.main`, `.masthead`, `.page`, `.display`, `.lede`, `.list-head`, `.count`, `.stock`, `.card`) agar kompatibilitas arsitektur tetap utuh.

---

## 1. Prinsip Estetika, Ringan GPU, & Presisi Desktop-Mobile
- **Karakter Visual**: *iPhone Frosted & Liquid Glass* yang dipadukan dengan presisi alat ukur teknisi elektronika — kaca transparan bersih, pantulan tepi halus (*specular hairline* 1px), sudut membulat proporsional ala iOS, *Floating Glass Dock*, dan angka tabular rapi.
- **Arsitektur Kaca Dua Tingkat (60fps di HP & Laptop)**:
  1. **Tier 1 — True Optical Glass (`.glass`)**: Memakai `backdrop-filter: blur(20px) saturate(180%)` + `-webkit-backdrop-filter: blur(20px) saturate(180%)` + `box-shadow: var(--shadow-float), inset 0 1px 0 var(--glass-specular)`. **HANYA** diterapkan pada elemen *floating chrome*: `.top-bar`, `.bottom-nav`, `.modal-box`, `.toast`, dan `.pwa-badge` (maksimal 3–4 lapisan aktif bersamaan).
  2. **Tier 2 — Lightweight Frosted Card (`.card`, panel form, segmented control)**: Memakai latar semi-transparan padat (`var(--surface)`), border kaca `1px solid var(--glass-border)`, pantulan atas `inset 0 1px 0 var(--glass-specular)`, dan bayangan lembut `var(--shadow-1)` **TANPA** `backdrop-filter`. Scroll daftar panjang tetap ringan dan bebas lag.
- **Presisi Tampilan Desktop (`>= 768px`)**:
  - `body` memakai latar kanvas ambient statis (`var(--bg)` + maksimal 2 radial tint statis beropasitas `<= 0.07`, tanpa animasi dan tanpa elemen DOM tambahan) agar efek refraksi `.glass` terlihat hidup.
  - `.top-bar` dan `.bottom-nav` **TIDAK** membentang penuh 100vw di desktop; keduanya sejajar presisi dengan kolom konten terpusat (`max-width: 480px`), sehingga di desktop aplikasi tampil seperti *iPhone Glass App Frame* yang rapi dan menyatu, bukan potongan tipis di tengah layar kosong.
- **Larangan Visual Keras**:
  1. Dilarang `glow`, `neon`, `text-shadow`, animasi blob bergerak, atau animasi *shimmer/skeleton* kedip-kedip.
  2. Dilarang memakai emoji sebagai ikon UI (wajib `lucide-react`, `strokeWidth={1.75}` atau `2`).
  3. Dilarang memuat font eksternal / Google Fonts / CDN (wajib *system font stack* Apple-first agar 100% bekerja offline).
  4. Dilarang menambah library CSS/UI eksternal (Tailwind, Bootstrap, MUI, Framer Motion).
  5. Dilarang menampilkan scrollbar horizontal bawaan OS pada bar filter pill (wajib `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`).

---

## 2. Token Warna & Tema (`web/src/index.css`)

Menggunakan palet **iOS Precision Glass** dengan kalibrasi biru iOS (`#005fcc` light / `#58a6ff` dark) yang lulus WCAG 2.1 AA/AAA (`>= 4.5:1` teks, `>= 3:1` non-teks) di kedua tema.

```css
:root,
html[data-theme='light'] {
  color-scheme: light;
  --bg: #eef2f7;
  --bg-ambient-1: rgba(0, 95, 204, 0.06);
  --bg-ambient-2: rgba(14, 165, 233, 0.05);

  --surface: rgba(255, 255, 255, 0.86);
  --surface-solid: #ffffff;
  --surface-2: rgba(241, 245, 249, 0.90);
  --glass-bg: rgba(255, 255, 255, 0.74);
  --glass-border: rgba(15, 23, 42, 0.10);
  --glass-specular: rgba(255, 255, 255, 0.90);

  --text: #0f172a;
  --text-muted: #475569;
  --border: rgba(15, 23, 42, 0.12);
  --border-strong: #64748b;

  --accent: #005fcc;
  --accent-contrast: #ffffff;
  --accent-tint: rgba(0, 95, 204, 0.12);

  --ok: #15803d;
  --ok-tint: rgba(22, 163, 74, 0.14);
  --warn: #b45309;
  --warn-tint: rgba(217, 119, 6, 0.15);
  --danger: #b91c1c;
  --danger-tint: rgba(220, 38, 38, 0.13);

  --status-planned: #475569;
  --status-planned-bg: rgba(100, 116, 139, 0.13);
  --status-progress: #005fcc;
  --status-progress-bg: rgba(0, 95, 204, 0.12);
  --status-done: #15803d;
  --status-done-bg: rgba(22, 163, 74, 0.14);

  --shadow-1: 0 2px 10px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-float: 0 10px 28px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.05);

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
  --bg: #070b14;
  --bg-ambient-1: rgba(88, 166, 255, 0.08);
  --bg-ambient-2: rgba(56, 189, 248, 0.05);

  --surface: rgba(22, 29, 44, 0.84);
  --surface-solid: #161d2c;
  --surface-2: rgba(30, 41, 59, 0.82);
  --glass-bg: rgba(17, 24, 39, 0.74);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-specular: rgba(255, 255, 255, 0.14);

  --text: #f8fafc;
  --text-muted: #94a3b8;
  --border: rgba(255, 255, 255, 0.12);
  --border-strong: #64748b;

  --accent: #58a6ff;
  --accent-contrast: #070b14;
  --accent-tint: rgba(88, 166, 255, 0.18);

  --ok: #4ade80;
  --ok-tint: rgba(74, 222, 128, 0.16);
  --warn: #fbbf24;
  --warn-tint: rgba(251, 191, 36, 0.16);
  --danger: #f87171;
  --danger-tint: rgba(248, 113, 113, 0.16);

  --status-planned: #cbd5e1;
  --status-planned-bg: rgba(148, 163, 184, 0.16);
  --status-progress: #58a6ff;
  --status-progress-bg: rgba(88, 166, 255, 0.18);
  --status-done: #4ade80;
  --status-done-bg: rgba(74, 222, 128, 0.16);

  --shadow-1: 0 2px 12px rgba(0, 0, 0, 0.28);
  --shadow-float: 0 12px 32px rgba(0, 0, 0, 0.45);
}