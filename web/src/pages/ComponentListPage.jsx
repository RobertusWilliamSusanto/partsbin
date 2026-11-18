import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PackageOpen,
  X,
} from 'lucide-react';
import { useComponents, updateComponentInCache } from '../hooks/useComponents';
import { invalidateProjectsCache } from '../hooks/useProjects';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import componentService from '../services/componentService';
import { formatRupiah } from '../utils/format';
import FilterBar from '../components/FilterBar';
import ComponentInlineForm from '../components/ComponentInlineForm';

const CATEGORY_PILLS = [
  { value: 'ALL', label: 'All' },
  { value: 'MCU', label: 'MCU' },
  { value: 'Sensor', label: 'Sensor' },
  { value: 'Passive', label: 'Passive' },
  { value: 'Power', label: 'Power' },
  { value: 'Actuator', label: 'Actuator' },
  { value: 'Connector', label: 'Connector' },
  { value: 'Display', label: 'Display' },
];

export default function ComponentListPage() {
  const { components, setComponents, loading, error, refetch } = useComponents();
  const isOnline = useOnlineStatus();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastError, setToastError] = useState(null);

  // Pemfilteran di sisi browser agar instan pada dataset kecil dan 100% berfungsi saat offline
  const filteredComponents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return components.filter((comp) => {
      if (category !== 'ALL' && comp.category !== category) return false;
      if (onlyLowStock && !comp.is_low_stock) return false;
      if (!q) return true;
      return (
        comp.name.toLowerCase().includes(q) ||
        comp.bin_location.toLowerCase().includes(q) ||
        (comp.specs || '').toLowerCase().includes(q)
      );
    });
  }, [components, search, category, onlyLowStock]);

  const handleStepStock = async (comp, delta) => {
    const nextStock = comp.stock + delta;
    if (nextStock < 0 || !isOnline) return;

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
            disabled={!isOnline}
          >
            {isFormOpen ? (
              <>
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>Tutup Form</span>
              </>
            ) : (
              <>
                <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>Tambah</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div style={{ marginBottom: 16 }}>
          <ComponentInlineForm
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
        pills={CATEGORY_PILLS}
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
          <div className="list-head">
            <h2>Daftar Inventaris</h2>
            <span className="count">
              {filteredComponents.length} / {components.length} item
            </span>
          </div>

          {filteredComponents.length === 0 ? (
            <div className="card empty-state">
              <PackageOpen size={20} strokeWidth={1.75} aria-hidden="true" />
              <p>Tidak ada komponen yang cocok dengan filter saat ini.</p>
            </div>
          ) : (
            <ul className="stock stock--components">
              {filteredComponents.map((comp) => {
                const isBusy = updatingId === comp.id;
                return (
                  <li key={comp.id} className="card card--interactive card--flex">
                    <Link to={`/components/${comp.id}`} className="card-link-area">
                      <div className="card-head">
                        <span className="card-title">{comp.name}</span>
                        {comp.is_low_stock ? (
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

                      <div className="row-wrap">
                        <span className="chip chip--neutral">{comp.category}</span>
                        <span className="mono-badge">{comp.bin_location}</span>
                      </div>
                    </Link>

                    <hr className="card-divider" />

                    <div className="row-between">
                      <div>
                        <div className="price">{formatRupiah(comp.unit_price)}</div>
                        <div className="count">Min. stok: {comp.min_stock} pcs</div>
                      </div>

                      <div className="stepper" aria-label={`Atur stok ${comp.name}`}>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => handleStepStock(comp, -1)}
                          disabled={comp.stock === 0 || !isOnline || isBusy}
                          aria-label={`Kurangi stok ${comp.name}`}
                        >
                          <Minus size={20} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <span className="stepper-val">{comp.stock}</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => handleStepStock(comp, 1)}
                          disabled={!isOnline || isBusy}
                          aria-label={`Tambah stok ${comp.name}`}
                        >
                          <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {toastError && (
        <div className="toast toast--error" role="alert">
          <span>{toastError}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setToastError(null)}
            aria-label="Tutup notifikasi"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
