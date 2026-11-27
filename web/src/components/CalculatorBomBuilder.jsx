import { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { getAvailableCategories } from '../utils/categories';

// Subkomponen perakit Bill of Materials (BOM) dengan dropdown <optgroup> per kategori & proteksi duplikat
export default function CalculatorBomBuilder({
  components = [],
  bomItems = [],
  onAddItem,
  onUpdateQty,
  onRemoveItem,
  disabled,
}) {
  const [selectedCompId, setSelectedCompId] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [error, setError] = useState(null);

  // Set ID komponen yang sudah masuk ke BOM untuk proteksi duplikat instan
  const selectedIds = useMemo(
    () => new Set(bomItems.map((it) => it.component_id)),
    [bomItems]
  );

  const categories = useMemo(
    () => getAvailableCategories(components),
    [components]
  );

  // Kelompokkan komponen berdasarkan kategori untuk <optgroup>
  const groupedComponents = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      map[cat] = [];
    }
    for (const comp of components) {
      const cat = comp.category || 'Passive';
      if (!map[cat]) map[cat] = [];
      map[cat].push(comp);
    }
    return map;
  }, [components, categories]);

  const handleAdd = (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedCompId) {
      setError('Silakan pilih salah satu komponen.');
      return;
    }
    if (selectedIds.has(selectedCompId)) {
      setError('Komponen ini sudah ada di dalam daftar BOM.');
      return;
    }
    const q = parseInt(qtyInput, 10);
    if (isNaN(q) || q < 1) {
      setError('Jumlah kebutuhan minimal 1.');
      return;
    }

    onAddItem(selectedCompId, q);
    setSelectedCompId('');
    setQtyInput('1');
  };

  return (
    <div className="card stack-md">
      <div className="card-head">
        <h2 className="card-title">Tambah Komponen ke BOM</h2>
        <span className="count">{bomItems.length} item terpilih</span>
      </div>

      <form className="stack-sm" onSubmit={handleAdd}>
        <div className="form-group">
          <label className="form-label" htmlFor="calc-comp-select">
            Pilih Komponen (Berkelompok per Kategori)
          </label>
          <select
            id="calc-comp-select"
            className="form-select"
            value={selectedCompId}
            onChange={(e) => {
              setSelectedCompId(e.target.value);
              setError(null);
            }}
            disabled={disabled}
          >
            <option value="">-- Pilih dari inventaris --</option>
            {categories.map((cat) => {
              const list = groupedComponents[cat] || [];
              if (list.length === 0) return null;
              return (
                <optgroup key={cat} label={`── ${cat} (${list.length}) ──`}>
                  {list.map((c) => {
                    const isAdded = selectedIds.has(c.id);
                    return (
                      <option key={c.id} value={c.id} disabled={isAdded}>
                        {c.name} [{c.bin_location}] — Stok: {c.stock} ({formatRupiah(c.unit_price)})
                        {isAdded ? ' [Sudah di BOM]' : ''}
                      </option>
                    );
                  })}
                </optgroup>
              );
            })}
          </select>
        </div>

        <div className="row-wrap" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label className="form-label" htmlFor="calc-qty-input">
              Jumlah Dibutuhkan
            </label>
            <input
              id="calc-qty-input"
              type="number"
              min="1"
              step="1"
              className="form-input num"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              disabled={disabled}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            style={{ minHeight: 44 }}
            disabled={disabled || !selectedCompId}
          >
            <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>Tambahkan</span>
          </button>
        </div>

        {error && <span className="error-text">{error}</span>}
      </form>

      {bomItems.length > 0 && (
        <ul className="stock" style={{ marginTop: 8 }}>
          {bomItems.map((item) => {
            const comp = item.component || {};
            const shortage = item.shortage_qty || 0;
            const isEnough = item.is_enough;

            return (
              <li key={item.component_id} className="card stack-sm">
                <div className="card-head">
                  <span className="card-title">{comp.name || 'Komponen'}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onRemoveItem(item.component_id)}
                    disabled={disabled}
                    aria-label={`Hapus ${comp.name} dari BOM`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="row-wrap">
                  <span className="mono-badge">{comp.bin_location || '-'}</span>
                  <span className={`chip chip--${isEnough ? 'ok' : 'danger'}`}>
                    {isEnough ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{isEnough ? 'Stok Cukup' : `Kurang ${shortage} pcs`}</span>
                  </span>
                </div>

                <div className="row-between">
                  <div className="row-wrap" style={{ alignItems: 'center', gap: 6 }}>
                    <span className="count">Butuh:</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-input num"
                      style={{ width: 70, height: 32, padding: '2px 6px' }}
                      value={item.quantity_needed}
                      onChange={(e) =>
                        onUpdateQty(item.component_id, parseInt(e.target.value, 10) || 1)
                      }
                      disabled={disabled}
                    />
                    <span className="count">pcs (Stok: {comp.stock ?? 0})</span>
                  </div>
                  <span className="price">{formatRupiah(item.subtotal || 0)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
