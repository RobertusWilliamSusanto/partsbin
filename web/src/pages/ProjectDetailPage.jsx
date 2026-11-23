import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Pencil, Trash2, Plus, AlertTriangle, X, FileDown } from 'lucide-react';
import { useProject, invalidateProjectsCache } from '../hooks/useProjects';
import { useComponents, invalidateComponentsCache } from '../hooks/useComponents';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import projectService from '../services/projectService';
import ConfirmModal from '../components/modals/ConfirmModal';
import ProjectCover from '../components/ProjectCover';
import ProjectGallery from '../components/ProjectGallery';
import ProjectStatusChanger from '../components/ProjectStatusChanger';
import ProjectReadinessCard from '../components/ProjectReadinessCard';
import ProjectShoppingCard from '../components/ProjectShoppingCard';
import ProjectBomList from '../components/ProjectBomList';

// Dokumen cetak dimuat secara lazy agar kode & CSS cetak tidak membebani initial bundle
const ProjectDocumentPrint = lazy(() => import('../components/ProjectDocumentPrint'));

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { project, setProject, loading, error, refetch, updateStatus } = useProject(id);
  const { components } = useComponents();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleteProjOpen, setIsDeleteProjOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [qtyNeeded, setQtyNeeded] = useState('1');
  const [addingItem, setAddingItem] = useState(false);
  const [toastError, setToastError] = useState(() => location.state?.warning || null);
  const isOnline = useOnlineStatus();
  const [printing, setPrinting] = useState(false);
  const [printPreparing, setPrintPreparing] = useState(false);

  const isPrintingRef = useRef(false);

  // Alur cetak PDF: render komponen cetak -> tunggu gambar siap -> window.print() -> pulihkan judul
  const handleDownloadPdf = () => {
    if (isPrintingRef.current || printing || !project) return;
    isPrintingRef.current = true;
    setPrintPreparing(true);
    setPrinting(true);
  };

  const printTriggeredRef = useRef(false);

  const handlePrintReady = useCallback(() => {
    if (printTriggeredRef.current) return;
    printTriggeredRef.current = true;
    setPrintPreparing(false);
    const originalTitle = document.title;
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = (project?.name || 'Proyek').replace(/[/\\?%*:|"<>]/g, '-');
    document.title = `PartsBin - ${safeName} - ${dateStr}`;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      isPrintingRef.current = false;
      printTriggeredRef.current = false;
      setPrinting(false);
      window.removeEventListener('afterprint', cleanup);
      window.removeEventListener('focus', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    // Fallback pulihkan judul & tombol bila browser mobile tidak memicu afterprint
    window.addEventListener('focus', cleanup, { once: true });

    setTimeout(() => {
      window.print();
    }, 100);
  }, [project]);

  // Alihkan URL sementara ke URL riil saat proyek offline selesai disinkronkan ke server
  useEffect(() => {
    if (!id || !id.startsWith('tmp_')) return;
    let active = true;
    const checkMapping = async () => {
      const { getItem } = await import('../offline/db');
      const mapped = await getItem('idmap', id);
      if (active && mapped?.realId) {
        navigate(`/projects/${mapped.realId}`, { replace: true });
      }
    };
    checkMapping();
    window.addEventListener('partsbin:sync-event', checkMapping);
    return () => {
      active = false;
      window.removeEventListener('partsbin:sync-event', checkMapping);
    };
  }, [id, navigate]);

  const handleStatusChange = async (newStatus) => {
    if (!project || updatingStatus || project.status === newStatus) return;
    setUpdatingStatus(true);
    setToastError(null);
    try {
      const res = await updateStatus(newStatus);
      if (res?.data) setProject((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      setToastError(err?.message || 'Gagal mengubah status pengerjaan proyek.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!project) return;
    const trimmed = editName.trim();
    if (!trimmed) return setToastError('Nama proyek wajib diisi.');
    setSavingEdit(true);
    try {
      const res = await projectService.update(project.id, { name: trimmed, description: editDesc.trim() });
      setProject((prev) => ({ ...prev, ...res.data }));
      invalidateProjectsCache();
      setIsEditing(false);
    } catch (err) {
      setToastError(err?.message || 'Gagal memperbarui data proyek.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await projectService.remove(project.id);
      invalidateProjectsCache();
      invalidateComponentsCache();
      navigate('/', { replace: true });
    } catch (err) {
      setIsDeleteProjOpen(false);
      setToastError(err?.message || 'Gagal menghapus proyek.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!project || !itemToDelete) return;
    setDeleting(true);
    try {
      await projectService.removeItem(project.id, itemToDelete.id);
      invalidateProjectsCache(project.id);
      invalidateComponentsCache();
      setItemToDelete(null);
      refetch({ silent: true });
    } catch (err) {
      setToastError(err?.message || 'Gagal mengeluarkan item dari BOM.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!project || !selectedCompId) return;
    setAddingItem(true);
    try {
      await projectService.addItem(project.id, { component_id: selectedCompId, quantity_needed: Number(qtyNeeded) || 1 });
      invalidateProjectsCache(project.id);
      invalidateComponentsCache();
      setSelectedCompId('');
      setQtyNeeded('1');
      refetch({ silent: true });
    } catch (err) {
      setToastError(err?.message || 'Gagal menambahkan komponen ke BOM.');
    } finally {
      setAddingItem(false);
    }
  };

  if (loading) return <section className="page"><div className="card loading-state"><span>Memuat detail proyek...</span></div></section>;
  if (error || !project) {
    return (
      <section className="page stack-md">
        <div className="card stack-md">
          <div className="alert alert--danger"><AlertTriangle size={20} strokeWidth={1.75} /><span>{error || 'Proyek tidak ditemukan.'}</span></div>
          <Link to="/" className="btn btn--primary">Kembali ke Dashboard</Link>
        </div>
      </section>
    );
  }

  const items = project.items || [];
  const summary = project.summary || {};

  return (
    <section className="page stack-md">
      <div className="card stack-md">
        <ProjectCover url={project.image_url} alt={project.name} />
        {isEditing ? (
          <form className="stack-md" onSubmit={handleSaveEdit}>
            <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <textarea className="form-textarea" rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Deskripsi..." />
            <div className="row-wrap">
              <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={savingEdit}><span>Simpan</span></button>
              <button type="button" className="btn btn--outline" style={{ flex: 1 }} onClick={() => setIsEditing(false)}><span>Batal</span></button>
            </div>
          </form>
        ) : (
          <>
            <div><h1 className="display">{project.name}</h1>{project.description && <p className="lede">{project.description}</p>}</div>
            <div className="row-wrap">
              <button type="button" className="btn btn--outline" style={{ flex: 1 }} onClick={() => { setEditName(project.name); setEditDesc(project.description || ''); setIsEditing(true); }}><Pencil size={18} /><span>Edit Info</span></button>
              <button type="button" className="btn btn--danger" style={{ flex: 1 }} onClick={() => setIsDeleteProjOpen(true)}><Trash2 size={18} /><span>Hapus</span></button>
            </div>
            <div className="stack-sm no-print" style={{ marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleDownloadPdf}
                disabled={printing}
                style={{ width: '100%' }}
              >
                <FileDown size={18} />
                <span>{printPreparing ? 'Menyiapkan Dokumen...' : 'Unduh PDF'}</span>
              </button>
              <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
                Di dialog cetak pilih &quot;Simpan sebagai PDF&quot; dan matikan &quot;Header dan footer&quot;.
              </p>
              {!isOnline && (
                <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center', margin: 0, color: 'var(--warn)' }}>
                  Mode offline: Gambar yang belum tersimpan di cache akan diganti placeholder pada dokumen cetak.
                </p>
              )}
            </div>
          </>
        )}
        <ProjectStatusChanger currentStatus={project.status} onStatusChange={handleStatusChange} disabled={updatingStatus} />
      </div>

      <ProjectGallery
        projectId={project.id}
        photos={project.photos || []}
        photoLimit={project.photo_limit ?? 12}
        onPhotoMutated={() => {
          invalidateProjectsCache(project.id);
          refetch({ silent: true });
        }}
        isOffline={!isOnline}
      />

      <ProjectReadinessCard summary={summary} />
      <ProjectBomList items={items} onRequestDelete={(it) => setItemToDelete(it)} />

      <div className="card stack-md">
        <h2 className="card-title">Tambah Komponen ke BOM</h2>
        <form className="stack-md" onSubmit={handleAddItem}>
          <select className="form-select" value={selectedCompId} onChange={(e) => setSelectedCompId(e.target.value)} required>
            <option value="">-- Pilih komponen dari inventaris --</option>
            {components.map((c) => <option key={c.id} value={c.id}>{c.name} [{c.bin_location}] (Stok: {c.stock})</option>)}
          </select>
          <input type="number" min="1" step="1" className="form-input num" value={qtyNeeded} onChange={(e) => setQtyNeeded(e.target.value)} placeholder="Jumlah dibutuhkan" required />
          <button type="submit" className="btn btn--primary" disabled={addingItem || !selectedCompId}><Plus size={18} /><span>{addingItem ? 'Menambahkan...' : 'Tambahkan ke BOM'}</span></button>
        </form>
      </div>

      <ProjectShoppingCard projectName={project.name} shoppingList={summary.shopping_list || []} missingCost={summary.missing_cost || 0} onToast={setToastError} />
      {toastError && <div className="toast toast--error glass"><span>{toastError}</span><button type="button" className="icon-btn" onClick={() => setToastError(null)} aria-label="Tutup notifikasi"><X size={18} /></button></div>}
      <ConfirmModal isOpen={isDeleteProjOpen} title="Hapus Proyek?" message={`Proyek "${project.name}" beserta BOM akan dihapus.`} confirmLabel="Hapus" loading={deleting} onConfirm={handleDeleteProject} onCancel={() => setIsDeleteProjOpen(false)} />
      <ConfirmModal isOpen={Boolean(itemToDelete)} title="Hapus Item BOM?" message={itemToDelete ? `Keluarkan "${itemToDelete.component_name}"?` : ''} confirmLabel="Keluarkan" loading={deleting} onConfirm={handleDeleteItem} onCancel={() => setItemToDelete(null)} />
      {printing && (
        <Suspense fallback={null}>
          <ProjectDocumentPrint project={project} onReady={handlePrintReady} />
        </Suspense>
      )}
    </section>
  );
}
