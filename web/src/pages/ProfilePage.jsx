import { useState } from 'react';
import { Sun, Moon, Wifi, WifiOff, FileText, Trash2, Info, User } from 'lucide-react';
import { STUDENT_PROFILE, APP_INFO } from '../config/profile';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  hasDraft,
  clearComponentDraft,
  hasCalculatorDraft,
  clearCalculatorDraft,
} from '../utils/draftStorage';

export default function ProfilePage({ theme, onToggleTheme }) {
  const isOnline = useOnlineStatus();
  const [draftExists, setDraftExists] = useState(() => hasDraft());
  const [calcDraftExists, setCalcDraftExists] = useState(() => hasCalculatorDraft());

  const handleClearDraft = () => {
    clearComponentDraft();
    setDraftExists(false);
  };

  const handleClearCalcDraft = () => {
    clearCalculatorDraft();
    setCalcDraftExists(false);
  };

  return (
    <section className="page stack-md">
      <div className="masthead">
        <h1 className="display">Profil & Tentang</h1>
        <p className="lede">Identitas pembuat, preferensi perangkat, dan arsitektur aplikasi.</p>
      </div>

      <div className="profile-grid">
        {/* Bagian 1: Identitas Pembuat & Kontrol Perangkat */}
        <div className="card stack-md">
          <div className="row-wrap">
            <User size={20} strokeWidth={1.75} aria-hidden="true" />
            <h2 className="card-title">Identitas Pembuat</h2>
          </div>

          <div className="stack-sm">
            <div className="row-between">
              <span className="muted">Nama</span>
              <strong>{STUDENT_PROFILE.name}</strong>
            </div>
            <div className="row-between">
              <span className="muted">NIM</span>
              <span className="mono-badge">{STUDENT_PROFILE.nim}</span>
            </div>
            <div className="row-between">
              <span className="muted">Program Studi</span>
              <span>{STUDENT_PROFILE.major}</span>
            </div>
            <div className="row-between">
              <span className="muted">Universitas</span>
              <span>{STUDENT_PROFILE.university}</span>
            </div>
            <div className="row-between">
              <span className="muted">Mata Kuliah</span>
              <span>{STUDENT_PROFILE.course}</span>
            </div>
          </div>

          <hr className="card-divider" />

          <div className="stack-sm">
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

        {/* Bagian 2: Tentang Aplikasi */}
        <div className="card stack-md">
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
            <span className="form-label">Rumus Kalkulator BOM & Stok</span>
            <div className="spec-cell">
              <span className="spec-cell__label">Kesiapan Rakit (Build Readiness %)</span>
              <span className="mono-badge" style={{ marginTop: 4 }}>
                {APP_INFO.formulaSummary.readiness}
              </span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell__label">Kekurangan per Item (Shopping Deficit)</span>
              <span className="mono-badge" style={{ marginTop: 4 }}>
                {APP_INFO.formulaSummary.shortage}
              </span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell__label">Deteksi Stok Menipis</span>
              <span className="mono-badge" style={{ marginTop: 4 }}>
                {APP_INFO.formulaSummary.lowStock}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
