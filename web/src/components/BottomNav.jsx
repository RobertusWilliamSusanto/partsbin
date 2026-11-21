import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Calculator, User } from 'lucide-react';
import { useComponents } from '../hooks/useComponents';

// 4 tab navigasi utama BottomNav sesuai spesifikasi v4.0 (aktif di seluruh lebar layar)
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/components', label: 'Komponen', icon: Cpu, end: false, hasBadge: true },
  { to: '/calculator', label: 'Kalkulator', icon: Calculator, end: false },
  { to: '/profile', label: 'Profil', icon: User, end: true },
];

export default function BottomNav() {
  const { components } = useComponents();

  const lowStockCount = useMemo(() => {
    return Array.isArray(components)
      ? components.filter((c) => c.is_low_stock).length
      : 0;
  }, [components]);

  return (
    <nav className="bottom-nav glass" aria-label="Navigasi utama">
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, hasBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bottom-nav__link${isActive ? ' active' : ''}`
            }
          >
            <div className="bottom-nav__icon-box">
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              {hasBadge && lowStockCount > 0 && (
                <span
                  className="bottom-nav__badge"
                  aria-label={`${lowStockCount} komponen stok menipis`}
                >
                  {lowStockCount > 99 ? '99+' : lowStockCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
