import { useParams } from 'react-router-dom';

export default function ProjectDetailPage() {
  const { id } = useParams();

  return (
    <section className="page">
      <div className="masthead">
        <h1 className="display">Detail Proyek BOM</h1>
        <p className="lede">
          ID Proyek: <span className="mono-badge">{id}</span>
        </p>
      </div>
      <div className="card">
        <p className="muted">
          Placeholder ProjectDetailPage — kalkulator kesiapan rakit, daftar item BOM, dan daftar belanja akan dibangun pada Tahap 4.
        </p>
      </div>
    </section>
  );
}
