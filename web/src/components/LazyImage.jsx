import { useState, useEffect, useRef } from 'react';

// Satu IntersectionObserver bersama dengan margin 200px untuk efisiensi pemuatan gambar
let sharedObserver = null;
const callbacks = new Map();

function getObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const cb = callbacks.get(e.target);
            if (cb) {
              cb();
              callbacks.delete(e.target);
              sharedObserver.unobserve(e.target);
            }
          }
        });
      },
      { rootMargin: '200px 0px' }
    );
  }
  return sharedObserver;
}

export default function LazyImage({ src, alt, className = '', width = '400', height = '300', onError, onClick }) {
  const [inView, setInView] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window));
  const elRef = useRef(null);

  useEffect(() => {
    if (inView) return;
    const el = elRef.current;
    const obs = getObserver();
    if (!el || !obs) {
      setInView(true);
      return;
    }
    callbacks.set(el, () => setInView(true));
    obs.observe(el);
    return () => {
      callbacks.delete(el);
      obs.unobserve(el);
    };
  }, [inView]);

  return (
    <div ref={elRef} style={{ width: '100%', height: '100%' }}>
      {inView ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          width={width}
          height={height}
          onError={onError}
          onClick={onClick}
          className={className}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        />
      ) : null}
    </div>
  );
}
