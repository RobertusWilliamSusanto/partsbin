import { useEffect, useRef, useState } from 'react';
import './ProjectDocumentPrint.css';
import { formatRupiah } from '../utils/format';
import { calcBom } from '../utils/bom';
import ProjectDocumentBom from './ProjectDocumentBom';

const STATUS_LABELS = {
  planned: 'Direncanakan',
  in_progress: 'Sedang Dikerjakan',
  done: 'Selesai',
};

// Komponen dokumen cetak A4 yang dirender saat printing=true untuk dicetak via window.print()
export default function ProjectDocumentPrint({ project, onReady }) {
  const docRef = useRef(null);

  // Hitung ulang analitik BOM secara deterministik dari satu sumber rumus utils/bom.js
  const bomResult = calcBom(project?.items || []);
  const summary = bomResult;
  const items = bomResult.items || [];
  const photos = project?.photos || [];

  const createdDate = project?.created_at
    ? new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  const [printDate] = useState(() =>
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );

  // Tunggu semua <img> di dokumen cetak selesai dimuat (atau gagal) dengan batas waktu 15 detik
  useEffect(() => {
    if (!docRef.current) return;
    const images = Array.from(docRef.current.querySelectorAll('img'));
    if (images.length === 0) { onReady?.(); return; }

    let isMounted = true;
    const promises = images.map((img) => new Promise((resolve) => {
      if (img.complete) { resolve(); } else { img.onload = () => resolve(); img.onerror = () => resolve(); }
    }));

    const timer = setTimeout(() => { if (isMounted) onReady?.(); }, 15000);
    Promise.all(promises).then(() => { clearTimeout(timer); if (isMounted) onReady?.(); });
    return () => { isMounted = false; clearTimeout(timer); };
  }, [onReady]);

  if (!project) return null;

  return (
    <article ref={docRef} className="project-print-document" aria-label="Dokumen Cetak Proyek">
      {/* 1. Header Dokumen */}
      <header className="print-doc__header">
        <h1 className="print-doc__title">{project.name}</h1>
        <div className="print-doc__meta">
          <span>Status: <strong>{STATUS_LABELS[project.status] || project.status}</strong></span>
          <span>Dibuat: {createdDate}</span>
        </div>
      </header>

      {/* 2. Deskripsi Proyek */}
      {project.description && (
        <p className="print-doc__desc">{project.description}</p>
      )}

      {/* 3. Sampul Proyek (jika ada) */}
      {project.image_url && (
        <div className="print-doc__cover-wrapper">
          <img
            src={project.image_url}
            alt={`Sampul ${project.name}`}
            className="print-doc__cover"
            loading="eager"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* 4. Ringkasan Kesiapan & Biaya BOM */}
      <div className="print-doc__summary">
        <div className="print-doc__summary-item">
          Kesiapan Rakit: <strong>{summary.readiness_percent}%</strong> ({summary.ready_items_count}/{summary.total_items} item siap)
        </div>
        <div className="print-doc__summary-item">
          Total Biaya BOM: <strong>{formatRupiah(summary.total_bom_cost)}</strong>
        </div>
        <div className="print-doc__summary-item">
          Biaya Kekurangan: <strong>{formatRupiah(summary.missing_cost)}</strong>
        </div>
      </div>

      {/* 5. Tabel Rincian BOM dan Daftar Belanja */}
      <ProjectDocumentBom items={items} shoppingList={summary.shopping_list || []} />

      {/* 6. Dokumentasi Foto */}
      <h2 className="print-doc__section-title">Dokumentasi Foto Proyek</h2>
      {photos.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666666', margin: '8px 0 16px 0' }}>
          Belum ada foto dokumentasi untuk proyek ini.
        </p>
      ) : (
        <div className="print-doc__photos-grid">
          {photos.map((p, idx) => (
            <figure key={p.id || idx} className="print-doc__figure">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.caption || `Dokumentasi ${idx + 1}`}
                  className="print-doc__photo"
                  loading="eager"
                  crossOrigin="anonymous"
                />
              ) : (
                <div style={{ height: '50mm', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '1px solid #ddd' }}>
                  <span style={{ fontSize: '8pt', color: '#888' }}>[Foto tidak tersedia di cache]</span>
                </div>
              )}
              <figcaption>
                Gambar {idx + 1}: {p.caption ? p.caption : 'Foto dokumentasi perakitan proyek'}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* 7. Footer */}
      <footer className="print-doc__footer">
        Dibuat dengan PartsBin — {printDate}
      </footer>
    </article>
  );
}
