import { ChevronLeft, ChevronRight } from 'lucide-react';

// Komponen kontrol pagination yang aksesibel (target sentuh 44px, angka tabular, aria-current)
export default function Pagination({ page, totalPages, onPageChange }) {
  // Sembunyikan kontrol jika data hanya 1 halaman atau kosong
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  // Buat deretan angka maksimal 5 item dengan elipsis jika total halaman panjang
  const getPages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const pages = getPages();

  return (
    <nav className="pagination-nav" aria-label="Navigasi halaman">
      <button
        type="button"
        className="pagination-btn pagination-prev"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>

      <div className="pagination-numbers">
        {pages.map((item, idx) => {
          if (item === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            );
          }

          const isCurrent = item === page;
          return (
            <button
              key={`page-${item}`}
              type="button"
              className={`pagination-btn pagination-num ${isCurrent ? 'active' : ''}`}
              onClick={() => onPageChange(item)}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Halaman ${item}`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="pagination-btn pagination-next"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
      >
        <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </nav>
  );
}
