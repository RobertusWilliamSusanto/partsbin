import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatRupiah } from '../utils/format';

// Kartu daftar belanja komponen yang kurang (Shopping Deficit)
export default function ProjectShoppingCard({ shoppingList = [], missingCost = 0 }) {
  if (missingCost <= 0 || shoppingList.length === 0) return null;

  return (
    <div className="card stack-md">
      <div className="card-head">
        <div className="row-wrap" style={{ flex: 1, minWidth: 0 }}>
          <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
          <h2 className="card-title">Daftar Belanja (Shopping Deficit)</h2>
        </div>
        <span className="chip chip--danger">{shoppingList.length} item</span>
      </div>

      <ul className="stock">
        {shoppingList.map((shop) => (
          <li key={shop.item_id || shop.component_id} className="spec-cell">
            <div className="card-head">
              <Link to={`/components/${shop.component_id}`} className="card-title">
                {shop.component_name}
              </Link>
              <span className="mono-badge">{shop.bin_location}</span>
            </div>
            <div className="row-between" style={{ marginTop: 4 }}>
              <span className="count">
                Kurang {shop.shortage_qty} pcs × {formatRupiah(shop.unit_price)}
              </span>
              <span className="price">{formatRupiah(shop.estimated_cost || (shop.shortage_qty * shop.unit_price))}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="row-between">
        <span className="form-label">Total Estimasi Belanja</span>
        <span className="price">{formatRupiah(missingCost)}</span>
      </div>
    </div>
  );
}
