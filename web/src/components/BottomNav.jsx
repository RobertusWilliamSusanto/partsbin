import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Calculator, User } from 'lucide-react';

// 4 tab navigasi utama BottomNav sesuai spesifikasi v4.0 (aktif di seluruh lebar layar)
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/components', label: 'Komponen', icon: Cpu, end: false },
  { to: '/calculator', label: 'Kalkulator', icon: Calculator, end: false },
  { to: '/profile', label: 'Profil', icon: User, end: true },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bottom-nav__link${isActive ? ' active' : ''}`
            }
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
