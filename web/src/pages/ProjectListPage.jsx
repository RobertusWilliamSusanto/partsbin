import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatRupiah } from '../utils/format';
import FilterBar from '../components/FilterBar';
import ProjectFormModal from '../components/modals/ProjectFormModal';

function getReadinessFillClass(percent, totalItems) {
  if (totalItems === 0 || percent < 50) return 'readiness-fill--warn';
  if (percent === 100) return 'readiness-fill--ok';
  return 'readiness-fill--accent';
}

function renderStatusChip(proj) {
  if (proj.total_items === 0) {
    return <span className="chip chip--neutral">Belum Ada BOM</span>;
  }
  if (proj.readiness_percent === 100) {
    return (
      <span className="chip chip--ok">
        <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
        <span>Siap Rakit</span>
      </span>
    );
  }
  if (proj.readiness_percent >= 50) {
    return (
      <span className="chip chip--warn">
        <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
        <span>Sebagian Siap</span>
      </span>
    );
  }
  return (
    <span className="chip chip--danger">
      <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
      <span>Perlu Belanja</span>
    </span>
  );
}

export default function ProjectListPage({ setTopBarAction }) {
  const { projects, loading, error, refetch } = useProjects();
  const isOnline = useOnlineStatus();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    setTopBarAction?.(
      <button
        type="button"
        className="btn btn--primary btn--sm"
        onClick={() => setIsFormOpen(true)}
        disabled={!isOnline}
      >
        <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
        <span>Proyek</span>
      </button>
    );
    return () => setTopBarAction?.(null);
  }, [setTopBarAction, isOnline]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (proj) =>
        proj.name.toLowerCase().includes(q) ||
        (proj.description || '').toLowerCase().includes(q)
    );
  }, [projects, search]);

  return (
    <section className="page">
      <div className="masthead">
        <h1 className="display">Proyek & BOM</h1>
        <p className="lede">
          Pantau persentase kesiapan rakit dan estimasi biaya komponen tiap proyek.
        </p>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Cari nama atau deskripsi proyek..."
      />

      {loading && (
        <div className="card loading-state" role="status">
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Memuat daftar proyek...</span>
        </div>
      )}

      {!loading && error && (
        <div className="card stack-md">
          <div className="alert alert--danger" role="alert">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button type="button" className="btn btn--outline" onClick={refetch}>
            <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="list-head">
            <h2>Daftar Proyek</h2>
            <span className="count">
              {filteredProjects.length} / {projects.length} proyek
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="card empty-state">
              <FolderKanban size={20} strokeWidth={1.75} aria-hidden="true" />
              <p>Tidak ada proyek yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <ul className="stock">
              {filteredProjects.map((proj) => (
                <li key={proj.id} className="card card--interactive">
                  <Link to={`/projects/${proj.id}`} className="stack-sm">
                    <div className="row-between">
                      <span className="card-title">{proj.name}</span>
                      {renderStatusChip(proj)}
                    </div>

                    {proj.description && <p className="muted">{proj.description}</p>}

                    <div className="readiness-row">
                      <div className="readiness-track" aria-hidden="true">
                        <div
                          className={`readiness-fill ${getReadinessFillClass(
                            proj.readiness_percent,
                            proj.total_items
                          )}`}
                          style={{ width: `${proj.readiness_percent}%` }}
                        />
                      </div>
                      <span className="readiness-pct">{proj.readiness_percent}%</span>
                    </div>

                    <div className="row-between">
                      <span className="count">
                        {proj.ready_items_count}/{proj.total_items} item BOM siap
                      </span>
                      <span className="price">{formatRupiah(proj.total_bom_cost)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => refetch()}
      />
    </section>
  );
}
