import { RefreshCw, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';

// Subkomponen panel rincian antrean mutasi & operasi gagal (dimuat on-demand via React.lazy)
export default function OfflinePanel({
  pendingCount,
  failedOps,
  isOnline,
  isSyncing,
  onSyncNow,
  onRetry,
  onDiscard,
}) {
  return (
    <>
      {pendingCount > 0 && (
        <div className="pwa-badge__box glass" role="status">
          <div className="pwa-badge__text">
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{pendingCount} perubahan menunggu sinkron</span>
          </div>
          {isOnline && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={onSyncNow}
              disabled={isSyncing}
            >
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          )}
        </div>
      )}

      {failedOps.map((op) => (
        <div
          key={op.id}
          className="pwa-badge__box glass"
          style={{ borderColor: 'var(--danger)' }}
          role="alert"
        >
          <div className="pwa-badge__text">
            <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-hidden="true" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Sinkronisasi Gagal</span>
              <span style={{ fontSize: 12, opacity: 0.85 }}>{op.lastError || 'Ditolak oleh server.'}</span>
            </div>
          </div>
          <div className="row-wrap" style={{ gap: 4 }}>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => onRetry(op.id)}
              title="Coba sinkronkan ulang"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Coba Lagi</span>
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onDiscard(op.id)}
              title="Buang perubahan lokal dan pulihkan dari server"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Buang</span>
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
