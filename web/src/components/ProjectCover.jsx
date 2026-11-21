import { useState } from 'react';

// Komponen penampil sampul gambar proyek dengan rasio 4:3 & fallback SVG inline (< 1 KB)
// Memenuhi Aturan Ringan: loading="lazy", decoding="async", crossOrigin="anonymous", bebas efek bayangan dan filter warna berlebih.
export default function ProjectCover({ url, alt = 'Sampul dokumentasi proyek', className = '' }) {
  const [hasError, setHasError] = useState(false);

  const showImage = Boolean(url) && !hasError;

  return (
    <div className={`project-cover ${className}`}>
      {showImage ? (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          width="400"
          height="300"
          onError={() => setHasError(true)}
          className="project-cover__img"
        />
      ) : (
        <div className="project-cover__fallback" aria-label={alt}>
          <svg
            viewBox="0 0 400 300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="project-cover__svg"
            aria-hidden="true"
          >
            {/* Siluet IC Mikroprosesor */}
            <rect x="150" y="100" width="100" height="100" rx="8" />
            <circle cx="170" cy="120" r="4" fill="currentColor" />
            {/* Kaki Pin IC */}
            <path d="M170 100V80M190 100V80M210 100V80M230 100V80" />
            <path d="M170 200v20M190 200v20M210 200v20M230 200v20" />
            <path d="M150 120h-20M150 140h-20M150 160h-20M150 180h-20" />
            <path d="M250 120h20M250 140h20M250 160h20M250 180h20" />
            {/* Jalur Tembaga PCB */}
            <path d="M80 80h50v40M320 80h-50v40M80 220h50v-40M320 220h-50v-40" />
            <circle cx="80" cy="80" r="3" fill="currentColor" />
            <circle cx="320" cy="80" r="3" fill="currentColor" />
            <circle cx="80" cy="220" r="3" fill="currentColor" />
            <circle cx="320" cy="220" r="3" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}
