import { useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Wifi,
  WifiOff,
  FileText,
  Trash2,
  Info,
  Pencil,
  Camera,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  APP_INFO,
  loadProfile,
  saveProfile,
  resetProfile,
  hasCustomProfile,
} from '../config/profile';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { compressImage } from '../utils/imageCompress';
import {
  hasDraft,
  clearComponentDraft,
  hasCalculatorDraft,
  clearCalculatorDraft,
} from '../utils/draftStorage';

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(blob);
  });
}

export default function ProfilePage({ theme, onToggleTheme }) {
  const isOnline = useOnlineStatus();
  const [draftExists, setDraftExists] = useState(() => hasDraft());
  const [calcDraftExists, setCalcDraftExists] = useState(() => hasCalculatorDraft());

  const [profile, setProfile] = useState(() => loadProfile());
  const [isCustomized, setIsCustomized] = useState(() => hasCustomProfile());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  const handleClearDraft = () => {
    clearComponentDraft();
    setDraftExists(false);
  };

  const handleClearCalcDraft = () => {
    clearCalculatorDraft();
    setCalcDraftExists(false);
  };

  const handleStartEdit = () => {
    setForm(profile);
    setPhotoError('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setForm(profile);
    setPhotoError('');
    setImgError(false);
    setEditing(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const saved = saveProfile(form);
    setProfile(saved);
    setIsCustomized(true);
    setImgError(false);
    setEditing(false);
  };

  const handleResetDefault = () => {
    const defaults = resetProfile();
    setProfile(defaults);
    setForm(defaults);
    setIsCustomized(false);
    setPhotoError('');
    setImgError(false);
    setEditing(false);
  };

  const handlePhotoChange = async (e) => {
    const rawFile = e.target.files?.[0];
    e.target.value = '';
    if (!rawFile) return;

    setPhotoError('');
    setPhotoBusy(true);
    try {
      const result = await compressImage(rawFile);
      const dataUrl = await blobToDataUrl(result.blob);
      setForm((prev) => ({ ...prev, photo: dataUrl }));
      setImgError(false);
    } catch (err) {
      setPhotoError(err?.message || 'Gagal memproses foto.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: '' }));
    setImgError(false);
    setPhotoError('');
  };

  const activePhoto = editing ? form.photo : profile.photo;
  const activeName = editing ? form.name : profile.name;

  return (
    <section className="page stack-md">
      <div className="masthead masthead--plain">
        <h1 className="display">Profil &amp; Tentang</h1>
        <p className="lede">Identitas pembuat, preferensi perangkat, dan arsitektur aplikasi.</p>
      </div>

      <div className="profile-grid">
        {/* Bagian 1: Identitas Pembuat & Kontrol Perangkat (tanpa card & tanpa garis) */}
        <div className="profile-section">
          <div className="profile-hero">
            <div className="profile-avatar" aria-hidden="true">
              {activePhoto && !imgError ? (
                <img
                  src={activePhoto}
                  alt={activeName}
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{getInitials(activeName)}</span>
              )}
            </div>

            <div className="profile-hero__info">
              <div className="profile-hero__name">{profile.name}</div>
              <span className="mono-badge">{profile.nim}</span>
            </div>

            {!editing && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={handleStartEdit}
                aria-label="Edit profil"
              >
                <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editing ? (
            <form className="stack-md" onSubmit={handleSaveEdit}>
              <div className="row-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoBusy}
                >
                  <Camera size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{photoBusy ? 'Memproses...' : form.photo ? 'Ganti Foto' : 'Tambah Foto'}</span>
                </button>
                {form.photo && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={handleRemovePhoto}
                    disabled={photoBusy}
                  >
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>

              {photoError && (
                <p className="muted" style={{ color: 'var(--danger)' }}>
                  {photoError}
                </p>
              )}

              <div className="stack-sm">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">
                    Nama
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-nim">
                    NIM
                  </label>
                  <input
                    id="profile-nim"
                    type="text"
                    className="form-input"
                    value={form.nim}
                    onChange={(e) => setForm((prev) => ({ ...prev, nim: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-major">
                    Program Studi
                  </label>
                  <input
                    id="profile-major"
                    type="text"
                    className="form-input"
                    value={form.major}
                    onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-university">
                    Universitas
                  </label>
                  <input
                    id="profile-university"
                    type="text"
                    className="form-input"
                    value={form.university}
                    onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-course">
                    Mata Kuliah
                  </label>
                  <input
                    id="profile-course"
                    type="text"
                    className="form-input"
                    value={form.course}
                    onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="row-wrap">
                <button type="submit" className="btn btn--primary btn--sm" disabled={photoBusy}>
                  <Check size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Simpan</span>
                </button>
                <button type="button" className="btn btn--outline btn--sm" onClick={handleCancelEdit}>
                  <X size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Batal</span>
                </button>
                {isCustomized && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={handleResetDefault}
                  >
                    <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>Reset Default</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="profile-meta-list">
              <div className="row-between">
                <span className="muted">Program Studi</span>
                <span>{profile.major}</span>
              </div>
              <div className="row-between">
                <span className="muted">Universitas</span>
                <span>{profile.university}</span>
              </div>
              <div className="row-between">
                <span className="muted">Mata Kuliah</span>
                <span>{profile.course}</span>
              </div>
            </div>
          )}

          <div className="profile-meta-list">
            <div className="row-between">
              <span className="muted">Tema Tampilan</span>
              <button type="button" className="btn btn--outline btn--sm" onClick={onToggleTheme}>
                {theme === 'dark' ? (
                  <>
                    <Sun size={20} strokeWidth={1.75} aria-hidden="true" />
                    <span>Ganti ke Terang</span>
                  </>
                ) : (
                  <>
                    <Moon size={20} strokeWidth={1.75} aria-hidden="true" />
                    <span>Ganti ke Gelap</span>
                  </>
                )}
              </button>
            </div>

            <div className="row-between">
              <span className="muted">Status Jaringan</span>
              {isOnline ? (
                <span className="chip chip--ok">
                  <Wifi size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="chip chip--warn">
                  <WifiOff size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Offline</span>
                </span>
              )}
            </div>

            <div className="row-between">
              <span className="muted">Draf Form Komponen</span>
              <div className="row-wrap">
                {draftExists ? (
                  <>
                    <span className="chip chip--warn">
                      <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
                      <span>Tersimpan</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={handleClearDraft}
                    >
                      <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
                      <span>Hapus</span>
                    </button>
                  </>
                ) : (
                  <span className="chip chip--neutral">Kosong</span>
                )}
              </div>
            </div>

            <div className="row-between">
              <span className="muted">Draf Kalkulator BOM</span>
              <div className="row-wrap">
                {calcDraftExists ? (
                  <>
                    <span className="chip chip--warn">
                      <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
                      <span>Tersimpan</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={handleClearCalcDraft}
                    >
                      <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
                      <span>Hapus</span>
                    </button>
                  </>
                ) : (
                  <span className="chip chip--neutral">Kosong</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 2: Tentang Aplikasi (tanpa card, menyatu rapi) */}
        <div className="profile-section" style={{ marginTop: 8 }}>
          <div className="card-head">
            <div className="row-wrap" style={{ flex: 1, minWidth: 0 }}>
              <Info size={20} strokeWidth={1.75} aria-hidden="true" />
              <h2 className="card-title">Tentang Aplikasi</h2>
            </div>
            <span className="mono-badge">v{APP_INFO.version}</span>
          </div>

          <div>
            <div className="card-title">{APP_INFO.name}</div>
            <p className="muted" style={{ marginTop: 4 }}>
              {APP_INFO.description}
            </p>
          </div>

          <div className="stack-sm">
            <span className="form-label">Teknologi Utama</span>
            <div className="row-wrap">
              {APP_INFO.techStack.map((tech) => (
                <span key={tech} className="chip chip--neutral">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="stack-sm">
            <span className="form-label">Rumus Kalkulator BOM &amp; Stok</span>
            <div className="stack-sm">
              <div>
                <div className="spec-cell__label">Kesiapan Rakit (Build Readiness %)</div>
                <span className="mono-badge" style={{ marginTop: 4 }}>
                  {APP_INFO.formulaSummary.readiness}
                </span>
              </div>
              <div>
                <div className="spec-cell__label">Kekurangan per Item (Shopping Deficit)</div>
                <span className="mono-badge" style={{ marginTop: 4 }}>
                  {APP_INFO.formulaSummary.shortage}
                </span>
              </div>
              <div>
                <div className="spec-cell__label">Deteksi Stok Menipis</div>
                <span className="mono-badge" style={{ marginTop: 4 }}>
                  {APP_INFO.formulaSummary.lowStock}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
