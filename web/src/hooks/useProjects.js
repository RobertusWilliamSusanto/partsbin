import { useState, useEffect, useCallback } from 'react';
import projectService from '../services/projectService';

export function useProjects() {
  const [projects, setProjects] = useState([]);
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
    projectService
      .getAll()
      .then((res) => {
        if (active) setProjects(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Gagal memuat daftar proyek.');
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
  const [project, setProject] = useState(null);
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
    projectService
      .getById(id)
      .then((res) => {
        if (active) setProject(res?.data || null);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Gagal memuat detail proyek.');
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
