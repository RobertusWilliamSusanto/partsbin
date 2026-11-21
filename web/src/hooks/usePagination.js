import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paginate } from '../utils/paginate.js';

// Custom hook pagination client-side (mendukung sinkronisasi URL query ?page= atau state lokal)
export function usePagination(items, { pageSize = 6, syncUrl = true, resetKey } = {}) {
  // Rules of Hooks: SELALU panggil kedua hook di tingkat atas secara konsisten
  const [searchParams, setSearchParams] = useSearchParams();
  const [localPage, setLocalPage] = useState(1);
  const [prevLocalKey, setPrevLocalKey] = useState(resetKey);

  // Ref untuk melacak nilai resetKey sebelumnya.
  // Kenapa memakai ref prevResetKey (bukan boolean isFirstMount)?
  // Di React StrictMode (atau saat browser me-refresh URL seperti /components?page=2),
  // komponen di-mount ulang. Membandingkan prevResetKey.current !== resetKey menjamin
  // bahwa reset ke halaman 1 HANYA berjalan ketika filter pencarian/kategori benar-benar berubah,
  // sehingga refresh pada halaman 2 tetap berada di halaman 2 (tidak terlempar ke halaman 1).
  const prevResetKeyRef = useRef(resetKey);

  // Ambil nomor halaman dari URL query jika syncUrl aktif
  const urlPage = useMemo(() => {
    const raw = searchParams.get('page');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
  }, [searchParams]);

  // Penyesuaian state lokal saat resetKey berubah (pola resmi React untuk reset state berbasis prop)
  if (!syncUrl && resetKey !== prevLocalKey) {
    setPrevLocalKey(resetKey);
    setLocalPage(1);
  }

  const currentPage = syncUrl ? urlPage : localPage;

  // Hitung pembagian halaman secara murni
  const paginationData = useMemo(() => {
    return paginate(items, currentPage, pageSize);
  }, [items, currentPage, pageSize]);

  // Auto-clamp state lokal jika melampaui totalPages saat data berkurang
  if (!syncUrl && localPage !== paginationData.page) {
    setLocalPage(paginationData.page);
  }

  // Handler pergantian halaman oleh aksi user
  const setPage = useCallback(
    (newPage) => {
      if (syncUrl) {
        // Kenapa memakai push ({ replace: false })? Agar riwayat navigasi browser tercatat,
        // sehingga tombol 'Back' fisik/bawaan perangkat dapat mengembalikan user ke halaman sebelumnya.
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('page', String(newPage));
            return next;
          },
          { replace: false }
        );
      } else {
        setLocalPage(newPage);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [syncUrl, setSearchParams]
  );

  // Efek reset ke halaman 1 pada URL query saat filter pencarian/kategori berubah
  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      // Kenapa memakai replace ({ replace: true })? Penggantian filter hanya menyaring tampilan saat ini,
      // bukan perjalanan eksplisit antar halaman, sehingga tidak boleh mengotori riwayat tombol 'Back'.
      if (syncUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('page', '1');
            return next;
          },
          { replace: true }
        );
      }
    }
  }, [resetKey, syncUrl, setSearchParams]);

  // Efek auto-clamp URL: jika item berkurang (misal setelah hapus) dan ?page= melampaui totalPages
  useEffect(() => {
    if (syncUrl && paginationData.page !== urlPage) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', String(paginationData.page));
          return next;
        },
        { replace: true }
      );
    }
  }, [syncUrl, paginationData.page, urlPage, setSearchParams]);

  const nextPage = useCallback(() => {
    if (paginationData.page < paginationData.totalPages) {
      setPage(paginationData.page + 1);
    }
  }, [paginationData.page, paginationData.totalPages, setPage]);

  const prevPage = useCallback(() => {
    if (paginationData.page > 1) {
      setPage(paginationData.page - 1);
    }
  }, [paginationData.page, setPage]);

  return {
    ...paginationData,
    setPage,
    nextPage,
    prevPage,
  };
}
