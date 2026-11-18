import { useState, useEffect, useCallback } from 'react';
import componentService from '../services/componentService';

// In-memory cache module-level (pola stale-while-revalidate tanpa library tambahan)
// Kenapa? Supaya perpindahan tab instan tanpa blank loading screen berulang.
let componentsListCache = null;
const componentDetailCache = new Map();

export function invalidateComponentsCache(id) {
  componentsListCache = null;
  if (id) {
    componentDetailCache.delete(id);
  } else {
    componentDetailCache.clear();
  }
}

export function updateComponentInCache(updatedComp) {
  if (!updatedComp?.id) return;
  if (Array.isArray(componentsListCache)) {
    componentsListCache = componentsListCache.map((item) =>
      item.id === updatedComp.id ? { ...item, ...updatedComp } : item
    );
  }
  const existingDetail = componentDetailCache.get(updatedComp.id);
  if (existingDetail) {
    componentDetailCache.set(updatedComp.id, { ...existingDetail, ...updatedComp });
  }
}

// Pola 2 Modul 5: custom hook daftar komponen dengan stale-while-revalidate
export function useComponents() {
  const [components, setComponents] = useState(() => componentsListCache ?? []);
  const [loading, setLoading] = useState(() => componentsListCache === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(({ silent = false } = {}) => {
    if (!silent && componentsListCache === null) {
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
        componentsListCache = list;
        if (active) {
          setComponents(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && componentsListCache === null) {
          setError(err?.message || 'Gagal memuat daftar komponen.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { components, setComponents, loading, error, refetch };
}

export function useComponent(id) {
  const cached = id ? componentDetailCache.get(id) ?? null : null;
  const [component, setComponent] = useState(() => cached);
  const [loading, setLoading] = useState(() => cached === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(
    ({ silent = false } = {}) => {
      if (!silent && !componentDetailCache.has(id)) {
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
        if (data) componentDetailCache.set(id, data);
        if (active) {
          setComponent(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && !componentDetailCache.has(id)) {
          setError(err?.message || 'Gagal memuat detail komponen.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  return { component, setComponent, loading, error, refetch };
}
