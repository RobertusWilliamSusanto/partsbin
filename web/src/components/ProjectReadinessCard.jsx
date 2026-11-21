import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../utils/format';

function getReadinessFillClass(percent, totalItems) {
  if (totalItems === 0 || percent < 50) return 'readiness-fill--warn';
  if (percent === 100) return 'readiness-fill--ok';
  return 'readiness-fill--accent';
}

// Kartu kesiapan rakit (Build Readiness %) proyek
export default function ProjectReadinessCard({ summary = {} }) {
  const total = summary.total_items || 0;
  const pct = summary.readiness_percent || 0;
  const ready = summary.ready_items_count || 0;

  return (
    <div className="card stack-md">
      <div className="card-head">
        <h2 className="card-title">Kesiapan Rakit (Build Readiness)</h2>
        {total > 0 && pct === 100 ? (
          <span className="chip chip--ok">
            <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>Siap Rakit</span>
          </span>
        ) : (
          <span className="chip chip--warn">
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{total === 0 ? 'BOM Kosong' : 'Belum Lengkap'}</span>
          </span>
        )}
      </div>

      <div className="readiness-row">
        <div className="readiness-track" aria-hidden="true">
          <div
            className={`readiness-fill ${getReadinessFillClass(pct, total)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="readiness-pct">{pct}%</span>
      </div>

      <div className="spec-grid">
        <div className="spec-cell">
          <span className="spec-cell__label">Item Cukup</span>
          <span className="spec-cell__value num">{ready} / {total}</span>
        </div>
        <div className="spec-cell">
          <span className="spec-cell__label">Total Biaya BOM</span>
          <span className="spec-cell__value num">{formatRupiah(summary.total_bom_cost || 0)}</span>
        </div>
      </div>

      <div className="spec-cell">
        <span className="spec-cell__label">Estimasi Biaya Kekurangan</span>
        <span className="spec-cell__value num">{formatRupiah(summary.missing_cost || 0)}</span>
      </div>
    </div>
  );
}
