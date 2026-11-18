import { useState, useEffect } from 'react';
import { WifiOff, Download } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function PWABadge() {
  const isOnline = useOnlineStatus();
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (isOnline && !installPrompt) return null;

  return (
    <div className="pwa-badge">
      <div className="stack-sm">
        {!isOnline && (
          <div className="pwa-badge__box pwa-badge__box--offline" role="status">
            <div className="pwa-badge__text">
              <WifiOff size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>Mode Offline — Data dari cache (aksi tulis dinonaktifkan)</span>
            </div>
          </div>
        )}

        {installPrompt && (
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
