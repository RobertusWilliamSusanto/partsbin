import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw, FolderPlus } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePagination } from '../hooks/usePagination';
import ProjectCover from '../components/ProjectCover';
import StatusChip from '../components/StatusChip';
import Pagination from '../components/Pagination';

// Halaman Dashboard Utama (v4.0) — Menampilkan seluruh daftar proyek dengan filter status & pagination
// Memenuhi Aturan Wajib Asprak R6 (List Proyek -> Detail /projects/:id)
export default function DashboardPage() {
  const { projects, loading, error, refetch } = useProjects();
  const isOnline = useOnlineStatus();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sinkronisasi status filter dengan URL query ?status=
  const statusFilter = searchParams.get('status') || 'ALL';

  const counts = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    return {
      all: list.length,
      planned: list.filter((p) => p.status === 'planned').length,
      in_progress: list.filter((p) => p.status === 'in_progress').length,
      done: list.filter((p) => p.status === 'done').length,
    };
  }, [projects]);

  const pills = [
    { value: 'ALL', label: `Semua ${counts.all}` },
    { value: 'planned', label: `Direncanakan ${counts.planned}` },
    { value: 'in_progress', label: `Dikerjakan ${counts.in_progress}` },
    { value: 'done', label: `Selesai ${counts.done}` },
  ];

  const handleStatusChange = (newStatus) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newStatus === 'ALL') {
          next.delete('status');
        } else {
          next.set('status', newStatus);
        }
        return next;
      },
      { replace: true }
    );
  };

  const filteredProjects = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    if (statusFilter === 'ALL') return list;
    return list.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  // Pagination client-side pageSize = 6, tersinkronisasi URL dan me-reset ke halaman 1 saat filter status berganti
  const { page, totalPages, pageItems, total, from, to, setPage } = usePagination(
    filteredProjects,
    { pageSize: 6, syncUrl: true, resetKey: statusFilter }
  );

  return (
    <section className="page">
      <div className="masthead">
        <h1 className="display">Dashboard Meja Kerja</h1>
        <p className="lede">Daftar proyek elektronika, status pengerjaan fisik, dan kesiapan rakit BOM.</p>
      </div>

      {!isOnline && (
        <div className="alert alert--warn" style={{ marginBottom: 16 }} role="status">
          <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Anda sedang offline. Menampilkan data dari memori cache.</span>
        </div>
      )}

      {/* Filter Status Pills dengan Penghitung Live */}
      <div className="filter-pills" role="tablist" aria-label="Filter status proyek" style={{ marginBottom: 16 }}>
        {pills.map(({ value, label }) => {
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`filter-pill ${isActive ? 'filter-pill--active' : ''}`}
              onClick={() => handleStatusChange(value)}
            >
              {label}
            </button>
          );
        })}
      </div>

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
          <button type="button" className="btn btn--outline" onClick={() => refetch()}>
            <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="list-head">
            <h2>Daftar Proyek</h2>
            <span className="count">{total > 0 ? `Menampilkan ${from}–${to} dari ${total}` : '0 proyek'}</span>
          </div>

          {projects.length === 0 ? (
            <div className="card empty-state">
              <FolderPlus size={32} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
              <p style={{ marginTop: 8 }}>Belum ada proyek terdaftar di workbench.</p>
              <Link to="/calculator" className="btn btn--primary" style={{ marginTop: 12 }}>
                Rancang Proyek Pertama
              </Link>
            </div>
          ) : total === 0 ? (
            <div className="card empty-state">
              <p>Tidak ada proyek dengan status ini.</p>
            </div>
          ) : (
            <>
              <ul className="stock stock--projects">
                {pageItems.map((proj) => (
                  <li key={proj.id}>
                    <Link to={`/projects/${proj.id}`} className="card card--interactive project-card">
                      <ProjectCover url={proj.image_url} alt={proj.name} />
                      <div className="project-card__body">
                        <div className="card-head">
                          <h2 className="card-title">{proj.name}</h2>
                          <StatusChip status={proj.status} />
                        </div>
                        <p className="project-desc">{proj.description || 'Tidak ada deskripsi.'}</p>
                        <div className="readiness-row" style={{ marginTop: 'auto' }}>
                          <div className="readiness-track" aria-hidden="true">
                            <div
                              className={`readiness-fill ${proj.readiness_percent === 100 ? 'readiness-fill--ok' : proj.readiness_percent >= 50 ? 'readiness-fill--accent' : 'readiness-fill--warn'}`}
                              style={{ width: `${proj.readiness_percent || 0}%` }}
                            />
                          </div>
                          <span className="readiness-pct">{proj.readiness_percent || 0}%</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}
    </section>
  );
}
