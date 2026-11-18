import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  FolderKanban,
  X,
} from 'lucide-react';
import {
  useComponent,
  invalidateComponentsCache,
  updateComponentInCache,
} from '../hooks/useComponents';
import { invalidateProjectsCache } from '../hooks/useProjects';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import componentService from '../services/componentService';
import { formatRupiah } from '../utils/format';
import ConfirmModal from '../components/modals/ConfirmModal';
import ComponentInlineForm from '../components/ComponentInlineForm';

export default function ComponentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { component, setComponent, loading, error, refetch } = useComponent(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [toastError, setToastError] = useState(null);

  const handleStepStock = async (delta) => {
    if (!component || !isOnline) return;
    const nextStock = component.stock + delta;
    if (nextStock < 0) return;

    setUpdatingStock(true);
    setToastError(null);
    try {
      const res = await componentService.updateStock(component.id, nextStock);
      // Pertahankan array used_in_projects agar tidak hilang setelah PATCH stok
      setComponent((prev) => ({ ...prev, ...res.data }));
      updateComponentInCache(res.data);
      invalidateProjectsCache();
    } catch (err) {
      setToastError(err?.message || 'Gagal memperbarui stok komponen.');
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!component || !isOnline) return;
    setDeleting(true);
    setToastError(null);
    try {
      await componentService.remove(component.id);
      invalidateComponentsCache();
      invalidateProjectsCache();
      navigate('/components', { replace: true });
    } catch (err) {
      // Tangani 409 Conflict (ON DELETE RESTRICT) bila komponen masih dipakai di BOM proyek
      setIsDeleteOpen(false);
      setToastError(
        err?.message || 'Komponen gagal dihapus. Periksa apakah masih dipakai di BOM proyek.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card loading-state" role="status">
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Memuat detail komponen...</span>
        </div>
      </section>
    );
  }

  if (error || !component) {
    return (
      <section className="page stack-md">
        <div className="card stack-md">
          <div className="alert alert--danger" role="alert">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{error || 'Data komponen tidak ditemukan.'}</span>
          </div>
          <div className="row-wrap">
            <button type="button" className="btn btn--outline" onClick={() => refetch()}>
              <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Coba Lagi</span>
            </button>
            <Link to="/components" className="btn btn--primary">
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const usedInProjects = component.used_in_projects || [];

  return (
    <section className="page stack-md">
      <div className="detail-layout">
        <div>
          {isEditing ? (
            <ComponentInlineForm
              initialData={component}
              onCancel={() => setIsEditing(false)}
              onSaved={(updated) => {
                setComponent((prev) => ({ ...prev, ...updated }));
                setIsEditing(false);
                refetch({ silent: true });
              }}
            />
          ) : (
            <div className="card stack-md">
              <div className="row-between">
                <span className="chip chip--neutral">{component.category}</span>
                {component.is_low_stock ? (
                  <span className="chip chip--warn">
                    <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
                    <span>Stok Menipis</span>
                  </span>
                ) : (
                  <span className="chip chip--ok">
                    <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
                    <span>Cukup</span>
                  </span>
                )}
              </div>

              <div>
                <h1 className="display">{component.name}</h1>
                <div style={{ marginTop: 8 }}>
                  <span className="mono-badge">Laci: {component.bin_location}</span>
                </div>
              </div>

              <div className="spec-grid">
                <div className="spec-cell">
                  <span className="spec-cell__label">Harga Satuan</span>
                  <span className="spec-cell__value num">
                    {formatRupiah(component.unit_price)}
                  </span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell__label">Stok / Minimum</span>
                  <span className="spec-cell__value num">
                    {component.stock} / {component.min_stock} pcs
                  </span>
                </div>
              </div>

              <div className="row-between">
                <span className="form-label">Koreksi Stok Cepat</span>
                <div className="stepper" aria-label="Atur stok komponen">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleStepStock(-1)}
                    disabled={component.stock === 0 || !isOnline || updatingStock}
                    aria-label="Kurangi stok"
                  >
                    <Minus size={20} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <span className="stepper-val">{component.stock}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleStepStock(1)}
                    disabled={!isOnline || updatingStock}
                    aria-label="Tambah stok"
                  >
                    <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div>
                <div className="spec-cell__label">Spesifikasi Teknis</div>
                <p className="muted" style={{ marginTop: 4 }}>
                  {component.specs || 'Belum ada catatan spesifikasi teknis.'}
                </p>
              </div>

              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn--outline"
                  style={{ flex: 1 }}
                  onClick={() => setIsEditing(true)}
                  disabled={!isOnline}
                >
                  <Pencil size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  style={{ flex: 1 }}
                  onClick={() => setIsDeleteOpen(true)}
                  disabled={!isOnline}
                >
                  <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          <div className="list-head" style={{ paddingTop: 0 }}>
            <h2>Dipakai di Proyek BOM</h2>
            <span className="count">{usedInProjects.length} proyek</span>
          </div>

          {usedInProjects.length === 0 ? (
            <div className="card empty-state">
              <FolderKanban size={20} strokeWidth={1.75} aria-hidden="true" />
              <p>Komponen ini belum terdaftar di BOM proyek mana pun.</p>
            </div>
          ) : (
            <ul className="stock">
              {usedInProjects.map((proj) => (
                <li key={proj.item_id} className="card card--interactive">
                  <Link to={`/projects/${proj.project_id}`} className="link-row">
                    <div className="stack-sm" style={{ minWidth: 0 }}>
                      <div className="card-title">{proj.project_name}</div>
                      <div className="count">Kebutuhan BOM: {proj.quantity_needed} pcs</div>
                    </div>
                    <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {toastError && (
        <div className="toast toast--error" role="alert">
          <span>{toastError}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setToastError(null)}
            aria-label="Tutup pesan error"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Hapus Komponen?"
        message={`Komponen "${component.name}" akan dihapus permanen dari katalog.`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </section>
  );
}
