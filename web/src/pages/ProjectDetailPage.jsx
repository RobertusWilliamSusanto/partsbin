import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  RefreshCw,
  X,
} from 'lucide-react';
import { useProject } from '../hooks/useProjects';
import { useComponents } from '../hooks/useComponents';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import projectService from '../services/projectService';
import { formatRupiah } from '../utils/format';
import ConfirmModal from '../components/modals/ConfirmModal';
import ProjectFormModal from '../components/modals/ProjectFormModal';

function getReadinessFillClass(percent, totalItems) {
  if (totalItems === 0 || percent < 50) return 'readiness-fill--warn';
  if (percent === 100) return 'readiness-fill--ok';
  return 'readiness-fill--accent';
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const { project, loading, error, refetch } = useProject(id);
  const { components } = useComponents();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteProjOpen, setIsDeleteProjOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedCompId, setSelectedCompId] = useState('');
  const [qtyNeeded, setQtyNeeded] = useState('1');
  const [addingItem, setAddingItem] = useState(false);
  const [toastError, setToastError] = useState(null);

  const handleDeleteProject = async () => {
    if (!project || !isOnline) return;
    setDeleting(true);
    setToastError(null);
    try {
      await projectService.remove(project.id);
      navigate('/projects', { replace: true });
    } catch (err) {
      setIsDeleteProjOpen(false);
      setToastError(err?.message || 'Gagal menghapus proyek.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!project || !itemToDelete || !isOnline) return;
    setDeleting(true);
    setToastError(null);
    try {
      await projectService.removeItem(project.id, itemToDelete.id);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      setItemToDelete(null);
      setToastError(err?.message || 'Gagal menghapus item dari BOM.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!project || !selectedCompId || !isOnline) return;

    const quantity = Number(qtyNeeded);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setToastError('Jumlah kebutuhan wajib bilangan bulat lebih dari 0.');
      return;
    }

    setAddingItem(true);
    setToastError(null);
    try {
      await projectService.addItem(project.id, {
        component_id: selectedCompId,
        quantity_needed: quantity,
      });
      setSelectedCompId('');
      setQtyNeeded('1');
      refetch();
    } catch (err) {
      // Termasuk 409 Conflict bila komponen sudah ada di BOM proyek ini
      setToastError(err?.message || 'Gagal menambahkan komponen ke BOM.');
    } finally {
      setAddingItem(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card loading-state" role="status">
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Memuat detail proyek BOM...</span>
        </div>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className="page stack-md">
        <div className="card stack-md">
          <div className="alert alert--danger" role="alert">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{error || 'Proyek tidak ditemukan.'}</span>
          </div>
          <div className="row-wrap">
            <button type="button" className="btn btn--outline" onClick={refetch}>
              <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Coba Lagi</span>
            </button>
            <Link to="/projects" className="btn btn--primary">
              Kembali ke Proyek
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const items = project.items || [];
  const summary = project.summary || {
    total_items: 0,
    ready_items_count: 0,
    readiness_percent: 0,
    total_bom_cost: 0,
    missing_cost: 0,
    shopping_list: [],
  };

  return (
    <section className="page stack-md">
      <div className="card stack-md">
        <div>
          <h1 className="display">{project.name}</h1>
          {project.description && <p className="lede">{project.description}</p>}
        </div>

        <div className="row-wrap">
          <button
            type="button"
            className="btn btn--outline"
            style={{ flex: 1 }}
            onClick={() => setIsEditOpen(true)}
            disabled={!isOnline}
          >
            <Pencil size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="btn btn--danger"
            style={{ flex: 1 }}
            onClick={() => setIsDeleteProjOpen(true)}
            disabled={!isOnline}
          >
            <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      <div className="card stack-md">
        <div className="row-between">
          <h2 className="card-title">Kesiapan Rakit (Build Readiness)</h2>
          {summary.total_items > 0 && summary.readiness_percent === 100 ? (
            <span className="chip chip--ok">
              <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Siap Rakit</span>
            </span>
          ) : (
            <span className="chip chip--warn">
              <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>{summary.total_items === 0 ? 'BOM Kosong' : 'Belum Lengkap'}</span>
            </span>
          )}
        </div>

        <div className="readiness-row">
          <div className="readiness-track" aria-hidden="true">
            <div
              className={`readiness-fill ${getReadinessFillClass(
                summary.readiness_percent,
                summary.total_items
              )}`}
              style={{ width: `${summary.readiness_percent}%` }}
            />
          </div>
          <span className="readiness-pct">{summary.readiness_percent}%</span>
        </div>

        <div className="spec-grid">
          <div className="spec-cell">
            <span className="spec-cell__label">Item Cukup</span>
            <span className="spec-cell__value num">
              {summary.ready_items_count} / {summary.total_items}
            </span>
          </div>
          <div className="spec-cell">
            <span className="spec-cell__label">Total Biaya BOM</span>
            <span className="spec-cell__value num">{formatRupiah(summary.total_bom_cost)}</span>
          </div>
        </div>

        <div className="spec-cell">
          <span className="spec-cell__label">Estimasi Biaya Kekurangan</span>
          <span className="spec-cell__value num">{formatRupiah(summary.missing_cost)}</span>
        </div>
      </div>

      <div>
        <div className="list-head">
          <h2>Daftar Item BOM</h2>
          <span className="count">{items.length} item</span>
        </div>

        {items.length === 0 ? (
          <div className="card empty-state">
            <p>Belum ada komponen di BOM proyek ini. Tambahkan melalui form di bawah.</p>
          </div>
        ) : (
          <ul className="stock">
            {items.map((item) => (
              <li key={item.id} className="card stack-sm">
                <div className="row-between">
                  <Link to={`/components/${item.component_id}`} className="card-title">
                    {item.component_name}
                  </Link>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setItemToDelete(item)}
                    disabled={!isOnline}
                    aria-label={`Hapus ${item.component_name} dari BOM`}
                  >
                    <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>

                <div className="row-wrap">
                  <span className="mono-badge">{item.bin_location}</span>
                  <span className="chip chip--neutral">{item.category}</span>
                  {item.is_enough ? (
                    <span className="chip chip--ok">
                      <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
                      <span>Cukup</span>
                    </span>
                  ) : (
                    <span className="chip chip--danger">
                      <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
                      <span>Kurang {item.shortage_qty}</span>
                    </span>
                  )}
                </div>

                <div className="row-between">
                  <span className="count">
                    Stok tersedia: {item.stock_available} pcs · Butuh: {item.quantity_needed} pcs
                  </span>
                  <span className="price">{formatRupiah(item.item_total_cost)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card stack-md">
        <h2 className="card-title">Tambah Komponen ke BOM</h2>
        <form className="stack-md" onSubmit={handleAddItem}>
          <div className="form-group">
            <label className="form-label" htmlFor="bom-comp-select">Pilih Komponen</label>
            <select
              id="bom-comp-select"
              className="form-select"
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              required
            >
              <option value="">-- Pilih komponen dari katalog --</option>
              {components.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} [{comp.bin_location}] (Stok: {comp.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bom-qty-input">Jumlah Dibutuhkan</label>
            <input
              id="bom-qty-input"
              type="number"
              min="1"
              step="1"
              className="form-input num"
              value={qtyNeeded}
              onChange={(e) => setQtyNeeded(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={addingItem || !isOnline || !selectedCompId}
          >
            <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{addingItem ? 'Menambahkan...' : 'Tambahkan ke BOM'}</span>
          </button>
        </form>
      </div>

      {summary.missing_cost > 0 && summary.shopping_list.length > 0 && (
        <div className="card stack-md">
          <div className="row-between">
            <div className="row-wrap">
              <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
              <h2 className="card-title">Daftar Belanja (Shopping Deficit)</h2>
            </div>
            <span className="chip chip--danger">{summary.shopping_list.length} item</span>
          </div>

          <ul className="stock">
            {summary.shopping_list.map((shop) => (
              <li key={shop.item_id} className="spec-cell">
                <div className="row-between">
                  <Link to={`/components/${shop.component_id}`} className="card-title">
                    {shop.component_name}
                  </Link>
                  <span className="mono-badge">{shop.bin_location}</span>
                </div>
                <div className="row-between" style={{ marginTop: 4 }}>
                  <span className="count">
                    Kurang {shop.shortage_qty} pcs × {formatRupiah(shop.unit_price)}
                  </span>
                  <span className="price">{formatRupiah(shop.estimated_cost)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="row-between">
            <span className="form-label">Total Estimasi Belanja</span>
            <span className="price">{formatRupiah(summary.missing_cost)}</span>
          </div>
        </div>
      )}

      {toastError && (
        <div className="toast glass toast--error" role="alert">
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

      <ProjectFormModal
        isOpen={isEditOpen}
        initialData={project}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => refetch()}
      />

      <ConfirmModal
        isOpen={isDeleteProjOpen}
        title="Hapus Proyek?"
        message={`Proyek "${project.name}" beserta seluruh daftar item BOM-nya akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setIsDeleteProjOpen(false)}
      />

      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Hapus Item BOM?"
        message={
          itemToDelete
            ? `Keluarkan "${itemToDelete.component_name}" dari BOM proyek ini?`
            : ''
        }
        confirmLabel="Keluarkan"
        loading={deleting}
        onConfirm={handleDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />
    </section>
  );
}
