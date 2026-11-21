import { Link } from 'react-router-dom';
import { Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../utils/format';

// Subkomponen kartu item katalog komponen dengan link ke detail dan stepper stok cepat
export default function ComponentCardItem({
  comp,
  isOnline,
  isBusy,
  onStepStock,
}) {
  return (
    <li className="card card--interactive card--flex">
      <Link to={`/components/${comp.id}`} className="card-link-area">
        <div className="card-head">
          <span className="card-title">{comp.name}</span>
          <span className={`chip chip--${comp.is_low_stock ? 'warn' : 'ok'}`}>
            {comp.is_low_stock ? (
              <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
            <span>{comp.is_low_stock ? 'Stok Menipis' : 'Cukup'}</span>
          </span>
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
            onClick={() => onStepStock(comp, -1)}
            disabled={comp.stock === 0 || !isOnline || isBusy}
            aria-label={`Kurangi stok ${comp.name}`}
          >
            <Minus size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className="stepper-val">{comp.stock}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => onStepStock(comp, 1)}
            disabled={!isOnline || isBusy}
            aria-label={`Tambah stok ${comp.name}`}
          >
            <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
