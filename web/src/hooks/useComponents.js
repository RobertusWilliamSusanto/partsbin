import { useState, useEffect, useCallback } from 'react';
import componentService from '../services/componentService';
import {
  getComponentsListCache,
  setComponentsListCache,
  getComponentDetailCache,
  setComponentDetailCache,
  invalidateComponentsCache,
  updateComponentInCache,
  subscribeComponents,
} from '../utils/dataCache';

export { invalidateComponentsCache, updateComponentInCache };

// Pola 2 Modul 5: custom hook daftar komponen dengan stale-while-revalidate
export function useComponents() {
  const [components, setComponents] = useState(() => getComponentsListCache() ?? []);
  const [loading, setLoading] = useState(() => getComponentsListCache() === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(({ silent = false } = {}) => {
    if (!silent && getComponentsListCache() === null) {
      setLoading(true);
    }
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    componentService
      .getAll()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setComponentsListCache(list);
        if (active) {
          setComponents(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && getComponentsListCache() === null) {
          setError(err?.message || 'Gagal memuat daftar komponen.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Dengarkan event sinkronisasi lintas-tab dan sinkronisasi latar belakang
    const handleSync = () => {
      refetch({ silent: true });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('partsbin:sync-event', handleSync);
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('partsbin:sync-event', handleSync);
      }
    };
  }, [reloadKey, refetch]);

  // Berlangganan perubahan in-memory cache komponen tanpa perlu pemicu fetch jaringan tambahan
  useEffect(() => {
    return subscribeComponents(() => {
      const cached = getComponentsListCache();
      if (cached) {
        setComponents((prev) => (prev === cached ? prev : cached));
      }
    });
  }, []);

  return { components, setComponents, loading, error, refetch };
}

export function useComponent(id) {
  const cached = getComponentDetailCache(id);
  const [component, setComponent] = useState(() => cached);
  const [loading, setLoading] = useState(() => cached === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(
    ({ silent = false } = {}) => {
      if (!silent && getComponentDetailCache(id) === null) {
        setLoading(true);
      }
      setError(null);
      setReloadKey((k) => k + 1);
    },
    [id]
  );

  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    componentService
      .getById(id)
      .then((res) => {
        const data = res?.data || null;
        if (data) setComponentDetailCache(id, data);
        if (active) {
          setComponent(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && getComponentDetailCache(id) === null) {
          setError(err?.message || 'Gagal memuat detail komponen.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Dengarkan event sinkronisasi lintas-tab untuk menyegarkan detail
    const handleSync = () => {
      refetch({ silent: true });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('partsbin:sync-event', handleSync);
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('partsbin:sync-event', handleSync);
      }
    };
  }, [id, reloadKey, refetch]);

  // Berlangganan perubahan cache detail komponen spesifik untuk sinkronisasi seketika
  useEffect(() => {
    if (!id) return undefined;
    return subscribeComponents(() => {
      const cached = getComponentDetailCache(id);
      if (cached) {
        setComponent((prev) => (prev === cached ? prev : cached));
      }
    });
  }, [id]);

  const activeComponent = component?.id === id ? component : cached;
  const isInitialLoading = loading && !activeComponent;

  return { component: activeComponent, setComponent, loading: isInitialLoading, error, refetch };
}
