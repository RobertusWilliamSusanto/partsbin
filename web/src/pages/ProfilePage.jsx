import { STUDENT_PROFILE, APP_INFO } from '../config/profile';

export default function ProfilePage() {
  return (
    <section className="page">
      <div className="masthead">
        <h1 className="display">Profil & Tentang</h1>
        <p className="lede">
          {STUDENT_PROFILE.name} — <span className="mono-badge">{STUDENT_PROFILE.nim}</span>
        </p>
      </div>
      <div className="card">
        <p className="muted">
          Placeholder ProfilePage ({APP_INFO.name} v{APP_INFO.version}) — rincian identitas pembuat, kontrol tema/status, dan informasi aplikasi akan dilengkapi pada Tahap 4.
        </p>
      </div>
    </section>
  );
}
