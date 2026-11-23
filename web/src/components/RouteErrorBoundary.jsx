import { Component } from 'react';
import { RotateCcw } from 'lucide-react';
import { reloadOnceForChunkError } from '../utils/chunkReload';

// Boundary penangkap error rendering rute dan pemulih otomatis chunk basi
export default class RouteErrorBoundary extends Component {
  state = { hasError: false, prevResetKey: this.props.resetKey };
  static getDerivedStateFromError() { return { hasError: true }; }

  // Reset status error saat navigasi berpindah ke rute lain berbasis prop resetKey
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.prevResetKey) {
      return { hasError: false, prevResetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error) {
    const msg = error?.message || String(error);
    const isChunk = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg);
    if (isChunk) reloadOnceForChunkError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card empty-state stack-sm" role="alert">
          <p>Terjadi kendala saat memuat halaman atau versi baru telah terpasang.</p>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => window.location.reload()}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
