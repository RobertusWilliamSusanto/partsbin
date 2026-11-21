import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import './App.css';
import { useTheme } from './hooks/useTheme';
import TopBar from './components/TopBar';
import PWABadge from './components/PWABadge';
import BottomNav from './components/BottomNav';
import DashboardPage from './pages/DashboardPage';
import ComponentListPage from './pages/ComponentListPage';
import ComponentDetailPage from './pages/ComponentDetailPage';

// Lazy loading halaman berat untuk menghemat ukuran bundle awal (JS gzip awal < 120 KB)
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function getRouteMeta(pathname) {
  if (pathname === '/') {
    return { title: 'PartsBin', subtitle: 'Dashboard Meja Kerja', showBack: false };
  }
  if (pathname === '/components') {
    return { title: 'PartsBin', subtitle: 'Katalog Komponen', showBack: false };
  }
  if (pathname.startsWith('/components/')) {
    return { title: 'Detail Komponen', subtitle: 'Inspektor Stok & BOM', showBack: true };
  }
  if (pathname === '/calculator') {
    return { title: 'Kalkulator BOM', subtitle: 'Perencanaan Proyek', showBack: false };
  }
  if (pathname === '/projects') {
    return { title: 'PartsBin', subtitle: 'Daftar Proyek', showBack: false };
  }
  if (pathname.startsWith('/projects/')) {
    return { title: 'Detail Proyek', subtitle: 'Kalkulator & Status BOM', showBack: true };
  }
  if (pathname === '/profile') {
    return { title: 'PartsBin', subtitle: 'Profil & Tentang', showBack: false };
  }
  return { title: 'PartsBin', subtitle: 'Workbench Inventory', showBack: false };
}

function AppShell() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const meta = getRouteMeta(pathname);

  return (
    <div className="shell">
      <TopBar
        title={meta.title}
        subtitle={meta.subtitle}
        showBack={meta.showBack}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <PWABadge />

      <main className="main">
        <Suspense fallback={<div className="card loading-state"><span>Memuat halaman...</span></div>}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/components" element={<ComponentListPage />} />
            <Route path="/components/:id" element={<ComponentDetailPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/projects/new" element={<Navigate to="/calculator" replace />} />
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route
              path="/profile"
              element={<ProfilePage theme={theme} onToggleTheme={toggleTheme} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
