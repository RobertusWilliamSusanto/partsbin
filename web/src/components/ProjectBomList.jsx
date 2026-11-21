import { Link } from 'react-router-dom';
import { Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/format';

// Subkomponen penampil daftar item Bill of Materials (BOM) pada halaman detail proyek
export default function ProjectBomList({ items = [], isOnline, onRequestDelete }) {
  return (
    <div>
      <div className="list-head">
        <h2>Daftar Item BOM</h2>
        <span className="count">{items.length} item</span>
      </div>
      {items.length === 0 ? (
        <div className="card empty-state">
          <p>BOM masih kosong. Tambahkan komponen di bawah.</p>
        </div>
      ) : (
        <ul className="stock">
          {items.map((it) => (
            <li key={it.id} className="card stack-sm">
              <div className="card-head">
                <Link to={`/components/${it.component_id}`} className="card-title">
                  {it.component_name}
                </Link>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRequestDelete(it)}
                  disabled={!isOnline}
                  aria-label={`Hapus ${it.component_name} dari BOM`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="row-wrap">
                <span className="mono-badge">{it.bin_location}</span>
                <span className={`chip chip--${it.is_enough ? 'ok' : 'danger'}`}>
                  {it.is_enough ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{it.is_enough ? 'Cukup' : `Kurang ${it.shortage_qty}`}</span>
                </span>
              </div>
              <div className="row-between">
                <span className="count">
                  Stok: {it.stock_available} / Butuh: {it.quantity_needed}
                </span>
                <span className="price">{formatRupiah(it.item_total_cost)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
