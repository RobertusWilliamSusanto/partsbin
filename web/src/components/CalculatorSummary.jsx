import { CheckCircle2, Save, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '../utils/format';

function getReadinessFillClass(percent, totalItems) {
  if (totalItems === 0 || percent < 50) return 'readiness-fill--warn';
  if (percent === 100) return 'readiness-fill--ok';
  return 'readiness-fill--accent';
}

// Subkomponen ringkasan live kesiapan rakit BOM, estimasi biaya, dan tombol finalisasi proyek
export default function CalculatorSummary({
  summary,
  isOnline,
  submitting,
  onFinalize,
}) {
  const percent = summary.readiness_percent || 0;
  const totalItems = summary.total_items || 0;
  const readyCount = summary.ready_items_count || 0;
  const totalCost = summary.total_bom_cost || 0;
  const missingCost = summary.missing_cost || 0;

  return (
    <div className="card stack-md">
      <div className="card-head">
        <h2 className="card-title">Ringkasan Perencanaan BOM</h2>
        <span className="count">Live Calculation</span>
      </div>

      <div className="readiness-block">
        <div className="readiness-row">
          <span className="form-label" style={{ margin: 0 }}>
            Kesiapan Perakitan (Build Readiness)
          </span>
          <span className="readiness-pct num">{percent}%</span>
        </div>

        <div className="readiness-track">
          <div
            className={`readiness-fill ${getReadinessFillClass(percent, totalItems)}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <span className="count" style={{ display: 'block', marginTop: 4 }}>
          {totalItems === 0
            ? 'Belum ada item BOM ditambahkan.'
            : `${readyCount} dari ${totalItems} jenis komponen tercukupi dari stok.`}
        </span>
      </div>

      <div className="spec-grid">
        <div className="spec-cell">
          <span className="spec-cell__label">Total Biaya BOM</span>
          <span className="spec-cell__value num">{formatRupiah(totalCost)}</span>
        </div>
        <div className="spec-cell">
          <span className="spec-cell__label">Estimasi Kekurangan (Defisit)</span>
          <span
            className="spec-cell__value num"
            style={{ color: missingCost > 0 ? 'var(--danger)' : 'var(--text)' }}
          >
            {formatRupiah(missingCost)}
          </span>
        </div>
      </div>

      {missingCost > 0 && (
        <div className="row-wrap" style={{ alignItems: 'center', gap: 6 }}>
          <ShoppingCart size={16} className="muted" />
          <span className="count">
            Diperlukan belanja tambahan sebesar {formatRupiah(missingCost)} untuk perakitan penuh.
          </span>
        </div>
      )}

      {percent === 100 && totalItems > 0 && (
        <div className="row-wrap" style={{ alignItems: 'center', gap: 6, color: 'var(--success)' }}>
          <CheckCircle2 size={16} />
          <span className="count" style={{ color: 'var(--success)', fontWeight: 600 }}>
            Seluruh komponen tersedia di laci meja kerja. Proyek siap dirakit!
          </span>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary"
        style={{ minHeight: 48, marginTop: 8 }}
        onClick={onFinalize}
        disabled={submitting || !isOnline}
      >
        <Save size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>{submitting ? 'Menyimpan Proyek...' : 'Finalisasi & Simpan Proyek'}</span>
      </button>
    </div>
  );
}
