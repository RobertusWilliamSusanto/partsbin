import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  useComponent,
  invalidateComponentsCache,
  updateComponentInCache,
} from '../hooks/useComponents';
import { invalidateProjectsCache } from '../hooks/useProjects';
import componentService from '../services/componentService';
import ConfirmModal from '../components/modals/ConfirmModal';
import ComponentInlineForm from '../components/ComponentInlineForm';
import ComponentSpecCard from '../components/ComponentSpecCard';
import ComponentUsedProjects from '../components/ComponentUsedProjects';

export default function ComponentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { component, setComponent, loading, error, refetch } = useComponent(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [toastError, setToastError] = useState(null);

  // Alihkan URL sementara ke URL riil saat komponen offline selesai disinkronkan ke server
  useEffect(() => {
    if (!id || !id.startsWith('tmp_')) return;
    let active = true;
    const checkMapping = async () => {
      const { getItem } = await import('../offline/db');
      const mapped = await getItem('idmap', id);
      if (active && mapped?.realId) {
        navigate(`/components/${mapped.realId}`, { replace: true });
      }
    };
    checkMapping();
    window.addEventListener('partsbin:sync-event', checkMapping);
    return () => {
      active = false;
      window.removeEventListener('partsbin:sync-event', checkMapping);
    };
  }, [id, navigate]);

  const handleStepStock = async (delta) => {
    if (!component) return;
    const nextStock = component.stock + delta;
    if (nextStock < 0) return;

    setUpdatingStock(true);
    setToastError(null);
    try {
      const res = await componentService.updateStock(component.id, nextStock);
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
    if (!component) return;
    setDeleting(true);
    setToastError(null);
    try {
      await componentService.remove(component.id);
      invalidateComponentsCache();
      invalidateProjectsCache();
      navigate('/components', { replace: true });
    } catch (err) {
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
            <ComponentSpecCard
              component={component}
              updatingStock={updatingStock}
              onStepStock={handleStepStock}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setIsDeleteOpen(true)}
            />
          )}
        </div>

        <ComponentUsedProjects usedInProjects={usedInProjects} />
      </div>

      {toastError && (
        <div className="toast toast--error glass" role="alert">
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
