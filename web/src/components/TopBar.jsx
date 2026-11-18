import { ArrowLeft, LayoutDashboard, Cpu, FolderKanban, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const DESKTOP_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/components', label: 'Komponen', icon: Cpu, end: false },
  { to: '/projects', label: 'Proyek', icon: FolderKanban, end: false },
  { to: '/profile', label: 'Profil', icon: User, end: true },
];

export default function TopBar({
  title = 'PartsBin',
  subtitle = 'Workbench Inventory',
  showBack = false,
  theme,
  onToggleTheme,
}) {
  const navigate = useNavigate();

  return (
    <header className="top-bar">
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

        {/* Navigasi horizontal desktop (>= 768px); tersembunyi di mobile karena memakai BottomNav */}
        <nav className="desktop-nav" aria-label="Navigasi utama desktop">
          {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `desktop-nav__link${isActive ? ' active' : ''}`
              }
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="top-bar__actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
