import { useState, useEffect, useCallback } from 'react';
import projectService from '../services/projectService';
import {
  getProjectsListCache,
  setProjectsListCache,
  getProjectDetailCache,
  setProjectDetailCache,
  invalidateProjectsCache,
} from '../utils/dataCache';

export { invalidateProjectsCache };

// Custom hook daftar proyek dengan stale-while-revalidate & invalidasi lintas-hook otomatis
export function useProjects() {
  const [projects, setProjects] = useState(() => getProjectsListCache() ?? []);
  const [loading, setLoading] = useState(() => getProjectsListCache() === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(({ silent = false } = {}) => {
    if (!silent && getProjectsListCache() === null) {
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
        setProjectsListCache(list);
        if (active) {
          setProjects(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && getProjectsListCache() === null) {
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
  const cached = getProjectDetailCache(id);
  const [project, setProject] = useState(() => cached);
  const [loading, setLoading] = useState(() => cached === null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(
    ({ silent = false } = {}) => {
      if (!silent && getProjectDetailCache(id) === null) {
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
        if (data) setProjectDetailCache(id, data);
        if (active) {
          setProject(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active && getProjectDetailCache(id) === null) {
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

  const activeProject = project?.id === id ? project : cached;
  const isInitialLoading = loading && !activeProject;

  return { project: activeProject, setProject, loading: isInitialLoading, error, refetch };
}
