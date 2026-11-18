import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function TopBar({
  title = 'PartsBin',
  subtitle = 'Workbench Inventory',
  showBack = false,
  action = null,
  theme,
  onToggleTheme,
}) {
  const navigate = useNavigate();

  return (
    <header className="top-bar glass">
      <div className="top-bar__inner">
        <div className="top-bar__left">
          {showBack && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => navigate(-1)}
              aria-label="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="top-bar__title">{title}</div>
            {subtitle && <div className="top-bar__subtitle">{subtitle}</div>}
          </div>
        </div>

        <div className="top-bar__actions">
          {action}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
