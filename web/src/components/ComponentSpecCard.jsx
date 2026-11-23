import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatRupiah } from '../utils/format';

// Subkomponen kartu inspeksi spesifikasi dan kontrol stok cepat komponen
export default function ComponentSpecCard({
  component,
  updatingStock,
  onStepStock,
  onEdit,
  onDelete,
}) {
  const isPending = String(component.id).startsWith('tmp_');

  return (
    <div className="card stack-md">
      <div className="row-between">
        <div className="row-wrap" style={{ gap: 4 }}>
          <span className="chip chip--neutral">{component.category}</span>
          {isPending && (
            <span className="chip chip--neutral" title="Perubahan belum tersinkron ke server">
              <Clock size={14} aria-hidden="true" />
              <span>Menunggu</span>
            </span>
          )}
        </div>
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
          <span className="spec-cell__value num">{formatRupiah(component.unit_price)}</span>
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
            onClick={() => onStepStock(-1)}
            disabled={component.stock === 0 || updatingStock}
            aria-label="Kurangi stok"
          >
            <Minus size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className="stepper-val">{component.stock}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => onStepStock(1)}
            disabled={updatingStock}
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
          onClick={onEdit}
        >
          <Pencil size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          className="btn btn--danger"
          style={{ flex: 1 }}
          onClick={onDelete}
        >
          <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
}
