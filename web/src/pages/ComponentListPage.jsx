import { useState, useMemo } from 'react';
import {
  Plus,
  AlertTriangle,
  RefreshCw,
  PackageOpen,
  X,
} from 'lucide-react';
import { useComponents, updateComponentInCache } from '../hooks/useComponents';
import { invalidateProjectsCache } from '../hooks/useProjects';
import { usePagination } from '../hooks/usePagination';
import { isLowStock } from '../utils/stock';
import { getAvailableCategories } from '../utils/categories';
import componentService from '../services/componentService';
import FilterBar from '../components/FilterBar';
import ComponentInlineForm from '../components/ComponentInlineForm';
import ComponentCardItem from '../components/ComponentCardItem';
import Pagination from '../components/Pagination';

export default function ComponentListPage() {
  const { components, setComponents, loading, error, refetch } = useComponents();

  const availableCategories = useMemo(
    () => getAvailableCategories(components),
    [components]
  );

  const categoryPills = useMemo(
    () =>
      ['ALL', ...availableCategories].map((v) => ({
        value: v,
        label: v === 'ALL' ? 'All' : v,
      })),
    [availableCategories]
  );

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastError, setToastError] = useState(null);

  // Filter client-side instan di browser agar 100% fungsional saat offline
  const filteredComponents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return components.filter((comp) => {
      if (category !== 'ALL' && comp.category !== category) return false;
      // Filter stok menipis berdasarkan fungsi terpusat isLowStock
      if (onlyLowStock && !isLowStock(comp)) return false;
      if (!q) return true;
      return (
        comp.name.toLowerCase().includes(q) ||
        comp.bin_location.toLowerCase().includes(q) ||
        (comp.specs || '').toLowerCase().includes(q)
      );
    });
  }, [components, search, category, onlyLowStock]);

  // Pagination client-side terikat URL query ?page= (reset saat filter berubah)
  const resetKey = `${search}:${category}:${onlyLowStock}`;
  const { page, totalPages, pageItems, total, setPage } = usePagination(
    filteredComponents,
    { pageSize: 6, syncUrl: true, resetKey }
  );

  const handleStepStock = async (comp, delta) => {
    const nextStock = comp.stock + delta;
    if (nextStock < 0) return;

    setUpdatingId(comp.id);
    setToastError(null);
    try {
      const res = await componentService.updateStock(comp.id, nextStock);
      setComponents((prev) => prev.map((item) => (item.id === comp.id ? res.data : item)));
      updateComponentInCache(res.data);
      invalidateProjectsCache();
    } catch (err) {
      setToastError(err?.message || 'Gagal memperbarui stok komponen.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="page">
      <div className="masthead">
        <div className="masthead__row">
          <div>
            <h1 className="display">Katalog Komponen</h1>
            <p className="lede">Cari berdasarkan nama, lokasi laci, atau spesifikasi teknis.</p>
          </div>
          <button
            type="button"
            className={`btn btn--sm ${isFormOpen ? 'btn--outline' : 'btn--primary'}`}
            onClick={() => setIsFormOpen((prev) => !prev)}
          >
            {isFormOpen ? <X size={20} strokeWidth={1.75} aria-hidden="true" /> : <Plus size={20} strokeWidth={1.75} aria-hidden="true" />}
            <span>{isFormOpen ? 'Tutup Form' : 'Tambah'}</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div style={{ marginBottom: 16 }}>
          <ComponentInlineForm
            categories={availableCategories}
            onCancel={() => setIsFormOpen(false)}
            onSaved={() => {
              setIsFormOpen(false);
              refetch({ silent: true });
            }}
          />
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Cari komponen, laci (A-01), atau spek..."
        pills={categoryPills}
        activePill={category}
        onPillChange={setCategory}
        extraToggle={{
          label: 'Stok Menipis',
          active: onlyLowStock,
          onToggle: () => setOnlyLowStock((prev) => !prev),
        }}
      />

      {loading && (
        <div className="card loading-state" role="status">
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Memuat daftar komponen...</span>
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
          {total === 0 ? (
            <div className="card empty-state">
              <PackageOpen size={20} strokeWidth={1.75} aria-hidden="true" />
              <p>Tidak ada komponen yang cocok dengan filter saat ini.</p>
            </div>
          ) : (
            <>
              <ul className="stock stock--components">
                {pageItems.map((comp) => (
                  <ComponentCardItem
                    key={comp.id}
                    comp={comp}
                    isBusy={updatingId === comp.id}
                    onStepStock={handleStepStock}
                  />
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {toastError && (
        <div className="toast toast--error glass" role="alert">
          <span>{toastError}</span>
          <button type="button" className="icon-btn" onClick={() => setToastError(null)} aria-label="Tutup notifikasi">
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
