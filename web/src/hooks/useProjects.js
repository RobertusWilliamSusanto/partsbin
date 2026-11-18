import { useState, useEffect, useCallback } from 'react';
import projectService from '../services/projectService';

// In-memory cache module-level (stale-while-revalidate) agar pindah tab instan tanpa flicker
let projectsListCache = null;
const projectDetailCache = new Map();

export function invalidateProjectsCache(id) {
  projectsListCache = null;
  if (id) {
    projectDetailCache.delete(id);
  } else {
    projectDetailCache.clear();
  }
}

export function useProjects() {
  const [projects, setProjects] = useState(() => projectsListCache ?? []);
  const [loading, setLoading] = useState(() => projectsListCache === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(({ silent = false } = {}) => {
    if (!silent && projectsListCache === null) {
      setLoading(true);
    }
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    projectService
      .getAll()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        projectsListCache = list;
        if (active) {
          setProjects(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && projectsListCache === null) {
          setError(err?.message || 'Gagal memuat daftar proyek.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { projects, setProjects, loading, error, refetch };
}

export function useProject(id) {
  const cached = id ? projectDetailCache.get(id) ?? null : null;
  const [project, setProject] = useState(() => cached);
  const [loading, setLoading] = useState(() => cached === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(
    ({ silent = false } = {}) => {
      if (!silent && !projectDetailCache.has(id)) {
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
    projectService
      .getById(id)
      .then((res) => {
        const data = res?.data || null;
        if (data) projectDetailCache.set(id, data);
        if (active) {
          setProject(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && !projectDetailCache.has(id)) {
          setError(err?.message || 'Gagal memuat detail proyek.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  return { project, setProject, loading, error, refetch };
}
