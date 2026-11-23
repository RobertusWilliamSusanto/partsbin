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

  const updateStatus = useCallback(
    async (id, status) => {
      const res = await projectService.updateStatus(id, status);
      invalidateProjectsCache(id);
      refetch({ silent: true });
      return res;
    },
    [refetch]
  );

  const uploadImage = useCallback(
    async (id, file) => {
      const res = await projectService.uploadImage(id, file);
      invalidateProjectsCache(id);
      refetch({ silent: true });
      return res;
    },
    [refetch]
  );

  return { projects, setProjects, loading, error, refetch, updateStatus, uploadImage };
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

    // Dengarkan event sinkronisasi lintas-tab untuk menyegarkan detail proyek
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

  const activeProject = project?.id === id ? project : cached;
  const isInitialLoading = loading && !activeProject;

  const updateStatus = useCallback(
    async (status) => {
      if (!id) return null;
      const res = await projectService.updateStatus(id, status);
      invalidateProjectsCache(id);
      refetch({ silent: true });
      return res;
    },
    [id, refetch]
  );

  const uploadImage = useCallback(
    async (file) => {
      if (!id) return null;
      const res = await projectService.uploadImage(id, file);
      invalidateProjectsCache(id);
      refetch({ silent: true });
      return res;
    },
    [id, refetch]
  );

  return {
    project: activeProject,
    setProject,
    loading: isInitialLoading,
    error,
    refetch,
    updateStatus,
    uploadImage,
  };
}
