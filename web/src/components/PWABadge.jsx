import { useState, useEffect } from 'react';
import { WifiOff, Download } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

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
  const [installPrompt, setInstallPrompt] = useState(() => {
    if (getIsStandalone()) return null;
    return typeof window !== 'undefined' ? window.__pwaPrompt || null : null;
  });

  useEffect(() => {
    // Abaikan registrasi listener bila aplikasi sudah berjalan dalam mode standalone
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

  const showInstall = Boolean(installPrompt) && !isStandalone;

  if (isOnline && !showInstall) return null;

  return (
    <div className="pwa-badge">
      <div className="stack-sm">
        {!isOnline && (
          <div className="pwa-badge__box pwa-badge__box--offline glass" role="status">
            <div className="pwa-badge__text">
              <WifiOff size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Mode Offline — Data dari cache (aksi tulis dinonaktifkan)</span>
            </div>
          </div>
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
