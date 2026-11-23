import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { WifiOff, Download } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

// Memuat panel antrean & op gagal secara lazy agar bundle awal tetap ringan
const OfflinePanel = lazy(() => import('./OfflinePanel'));

// Deteksi apakah aplikasi dibuka dalam mode standalone PWA
function getIsStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  );
}

export default function PWABadge() {
  const isOnline = useOnlineStatus();
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedOps, setFailedOps] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(() => {
    if (getIsStandalone()) return null;
    return typeof window !== 'undefined' ? window.__pwaPrompt || null : null;
  });

  // Memuat status outbox secara asinkron tanpa memblokir initial render
  const refreshOutboxStatus = useCallback(async () => {
    try {
      const { getAll } = await import('../offline/db');
      const allOps = await getAll('outbox');
      const pending = allOps.filter((op) => op.status === 'pending');
      const failed = allOps.filter((op) => op.status === 'failed');
      setPendingCount(pending.length);
      setFailedOps(failed);
    } catch {
      // Abaikan bila IndexedDB belum tersedia
    }
  }, []);

  useEffect(() => {
    let active = true;
    import('../offline/db')
      .then(({ getAll }) => getAll('outbox'))
      .then((allOps) => {
        if (!active) return;
        const pending = allOps.filter((op) => op.status === 'pending');
        const failed = allOps.filter((op) => op.status === 'failed');
        setPendingCount(pending.length);
        setFailedOps(failed);
      })
      .catch(() => {});

    const handleSyncEvent = () => refreshOutboxStatus();
    window.addEventListener('partsbin:sync-event', handleSyncEvent);
    window.addEventListener('online', handleSyncEvent);

    return () => {
      active = false;
      window.removeEventListener('partsbin:sync-event', handleSyncEvent);
      window.removeEventListener('online', handleSyncEvent);
    };
  }, [refreshOutboxStatus]);

  useEffect(() => {
    if (getIsStandalone()) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.__pwaPrompt = e;
      setInstallPrompt(e);
    };

    const handleCustomPrompt = () => {
      if (window.__pwaPrompt) {
        setInstallPrompt(window.__pwaPrompt);
      }
    };

    const handleInstalled = () => {
      window.__pwaPrompt = null;
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('partsbin:pwa-prompt', handleCustomPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('partsbin:pwa-prompt', handleCustomPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    window.__pwaPrompt = null;
    setInstallPrompt(null);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const { flushOutbox } = await import('../offline/syncEngine');
      await flushOutbox();
    } finally {
      setIsSyncing(false);
      refreshOutboxStatus();
    }
  };

  const handleRetry = async (opId) => {
    const { retryOp } = await import('../offline/outbox');
    const { flushOutbox } = await import('../offline/syncEngine');
    await retryOp(opId);
    await refreshOutboxStatus();
    flushOutbox();
  };

  const handleDiscard = async (opId) => {
    const { removeOp } = await import('../offline/outbox');
    const { broadcastSyncEvent } = await import('../offline/syncEngine');
    await removeOp(opId);
    await refreshOutboxStatus();
    broadcastSyncEvent('data_discarded');
  };

  const showInstall = Boolean(installPrompt) && !isStandalone;
  const hasOps = pendingCount > 0 || failedOps.length > 0;
  const showBadge = !isOnline || hasOps || showInstall;

  if (!showBadge) return null;

  return (
    <div className="pwa-badge">
      <div className="stack-sm">
        {!isOnline && (
          <div className="pwa-badge__box pwa-badge__box--offline glass" role="status">
            <div className="pwa-badge__text">
              <WifiOff size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Mode Offline — Perubahan disimpan di perangkat dan otomatis disinkronkan saat online.</span>
            </div>
          </div>
        )}

        {hasOps && (
          <Suspense fallback={null}>
            <OfflinePanel
              pendingCount={pendingCount}
              failedOps={failedOps}
              isOnline={isOnline}
              isSyncing={isSyncing}
              onSyncNow={handleSyncNow}
              onRetry={handleRetry}
              onDiscard={handleDiscard}
            />
          </Suspense>
        )}

        {showInstall && (
          <div className="pwa-badge__box glass">
            <div className="pwa-badge__text">
              <Download size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Pasang PartsBin di perangkat Anda</span>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleInstallClick}
            >
              Install
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
