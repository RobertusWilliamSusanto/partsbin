import { useState, useEffect, useCallback } from 'react';
import componentService from '../services/componentService';

// Pola 2 Modul 5: custom hook pengelola state loading, error, dan refetch daftar komponen
export function useComponents() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    componentService
      .getAll()
      .then((res) => {
        if (active) setComponents(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Gagal memuat daftar komponen.');
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
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    componentService
      .getById(id)
      .then((res) => {
        if (active) setComponent(res?.data || null);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Gagal memuat detail komponen.');
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
