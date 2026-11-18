import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  FolderKanban,
  PackageCheck,
} from 'lucide-react';
import { useComponents } from '../hooks/useComponents';
import { useProjects } from '../hooks/useProjects';
import { formatRupiah } from '../utils/format';

export default function DashboardPage() {
  const {
    components,
    loading: loadingComp,
    error: errorComp,
    refetch: refetchComp,
  } = useComponents();
  const {
    projects,
    loading: loadingProj,
    error: errorProj,
    refetch: refetchProj,
  } = useProjects();

  // Metrik dashboard dihitung langsung dari data komponen & proyek agar sinkron saat offline
  const metrics = useMemo(() => {
    const totalAssetValue = components.reduce(
      (acc, comp) => acc + comp.stock * comp.unit_price,
      0
    );
    const lowStockComponents = components.filter((comp) => comp.is_low_stock);
    const readyProjects = projects.filter(
      (proj) => proj.total_items > 0 && proj.readiness_percent === 100
    );

    return {
      totalTypes: components.length,
      totalAssetValue,
      lowStockComponents,
      readyProjects,
    };
  }, [components, projects]);

  const loading = loadingComp || loadingProj;
  const error = errorComp || errorProj;

  const handleRetry = () => {
    refetchComp();
    refetchProj();
  };

  return (
    <section className="page stack-md">
      <div className="masthead">
        <h1 className="display">Dashboard Meja Kerja</h1>
        <p className="lede">
          Ringkasan stok komponen, estimasi aset, dan kesiapan rakit proyek elektronika.
        </p>
      </div>

      {loading && (
        <div className="card loading-state" role="status">
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Memuat ringkasan inventaris...</span>
        </div>
      )}

      {!loading && error && (
        <div className="card stack-md">
          <div className="alert alert--danger" role="alert">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button type="button" className="btn btn--outline" onClick={handleRetry}>
            <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Total Jenis Komponen</span>
              <span className="stat-value">{metrics.totalTypes}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Estimasi Nilai Aset</span>
              <span className="stat-value">{formatRupiah(metrics.totalAssetValue)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Komponen Stok Menipis</span>
              <span className="stat-value">{metrics.lowStockComponents.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Proyek Siap Rakit (100%)</span>
              <span className="stat-value">{metrics.readyProjects.length}</span>
            </div>
          </div>

          <div>
            <div className="list-head">
              <h2>Peringatan Stok Menipis</h2>
              <span className="count">{metrics.lowStockComponents.length} item</span>
            </div>

            {metrics.lowStockComponents.length === 0 ? (
              <div className="card empty-state">
                <PackageCheck size={20} strokeWidth={1.75} aria-hidden="true" />
                <p>Seluruh komponen berada di atas batas stok minimum.</p>
              </div>
            ) : (
              <ul className="stock">
                {metrics.lowStockComponents.map((comp) => (
                  <li key={comp.id} className="card card--interactive">
                    <Link to={`/components/${comp.id}`} className="link-row">
                      <div className="stack-sm" style={{ minWidth: 0 }}>
                        <span className="card-title">{comp.name}</span>
                        <div className="row-wrap">
                          <span className="mono-badge">{comp.bin_location}</span>
                          <span className="chip chip--warn">
                            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
                            <span>
                              Stok {comp.stock} / Min {comp.min_stock}
                            </span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="list-head">
              <h2>Proyek Siap Rakit (100%)</h2>
              <span className="count">{metrics.readyProjects.length} proyek</span>
            </div>

            {metrics.readyProjects.length === 0 ? (
              <div className="card empty-state">
                <FolderKanban size={20} strokeWidth={1.75} aria-hidden="true" />
                <p>Belum ada proyek dengan kesiapan BOM 100%.</p>
              </div>
            ) : (
              <ul className="stock">
                {metrics.readyProjects.map((proj) => (
                  <li key={proj.id} className="card card--interactive">
                    <Link to={`/projects/${proj.id}`} className="link-row">
                      <div className="stack-sm" style={{ minWidth: 0 }}>
                        <span className="card-title">{proj.name}</span>
                        <div className="row-wrap">
                          <span className="chip chip--ok">
                            <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
                            <span>Siap Rakit</span>
                          </span>
                          <span className="count">
                            {proj.total_items} item BOM · {formatRupiah(proj.total_bom_cost)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
