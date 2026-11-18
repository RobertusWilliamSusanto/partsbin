import { useParams } from 'react-router-dom';

export default function ComponentDetailPage() {
  const { id } = useParams();

  return (
    <section className="page">
      <div className="masthead">
        <h1 className="display">Detail Komponen</h1>
        <p className="lede">
          ID Komponen: <span className="mono-badge">{id}</span>
        </p>
      </div>
      <div className="card">
        <p className="muted">
          Placeholder ComponentDetailPage — spesifikasi teknis, stepper stok, dan daftar proyek pengguna akan dibangun pada Tahap 3.
        </p>
      </div>
    </section>
  );
}
