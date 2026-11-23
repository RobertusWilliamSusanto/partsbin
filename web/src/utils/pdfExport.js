import { formatRupiah } from './format';
import { calcBom } from './bom';

const STATUS_LABELS = { planned: 'Direncanakan', in_progress: 'Sedang Dikerjakan', done: 'Selesai' };

// Konversi gambar (URL/WebP/PNG) ke JPEG Data URL via Canvas untuk standar kompatibilitas PDF
async function loadImageDataUrl(src) {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL('image/jpeg', 0.85), width: c.width, height: c.height });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Generate dan simpan berkas PDF biner langsung sekali klik tanpa dialog printer browser
export async function exportProjectPdf(project) {
  if (!project) return;
  const { jsPDF } = await import('jspdf');
  const autoTablePkg = await import('jspdf-autotable');
  const autoTable = typeof autoTablePkg.default === 'function' ? autoTablePkg.default : (typeof autoTablePkg === 'function' ? autoTablePkg : autoTablePkg.default?.default);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const [pageW, pageH, margin] = [210, 297, 14];
  const contentW = pageW - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededH) => {
    if (cursorY + neededH > pageH - margin - 8) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  };

  // 1. Header & Meta
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(20, 20, 20);
  doc.text(project.name || 'Proyek PartsBin', margin, cursorY);
  cursorY += 6.5;

  const statusTxt = STATUS_LABELS[project.status] || project.status || 'Direncanakan';
  const createdDate = project.created_at ? new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 100, 100);
  doc.text(`Status: ${statusTxt}   |   Dibuat: ${createdDate}`, margin, cursorY);
  cursorY += 3.5;

  doc.setDrawColor(40, 40, 40).setLineWidth(0.4).line(margin, cursorY, margin + contentW, cursorY);
  cursorY += 5;

  // 2. Deskripsi Proyek
  if (project.description) {
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(50, 50, 50);
    const descLines = doc.splitTextToSize(project.description, contentW);
    doc.text(descLines, margin, cursorY);
    cursorY += descLines.length * 4.2 + 3;
  }

  // 3. Sampul Proyek
  if (project.image_url) {
    try {
      const cover = await loadImageDataUrl(project.image_url);
      if (cover) {
        const maxH = 50;
        const aspect = cover.width / cover.height;
        const drawW = Math.min(contentW, maxH * aspect);
        const drawH = drawW / aspect;
        checkPageBreak(drawH + 5);
        doc.addImage(cover.dataUrl, 'JPEG', margin + (contentW - drawW) / 2, cursorY, drawW, drawH);
        cursorY += drawH + 5;
      }
    } catch {
      // Abaikan jika cover gagal dimuat
    }
  }

  // 4. Ringkasan Kesiapan & Biaya BOM
  const summary = calcBom(project.items || []);
  checkPageBreak(20);
  doc.setFillColor(248, 248, 248).setDrawColor(220, 220, 220).rect(margin, cursorY, contentW, 16, 'FD');
  const colW = contentW / 3;
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(50, 50, 50);
  doc.text('Kesiapan Rakit:', margin + 3, cursorY + 5);
  doc.setFont('helvetica', 'bold').text(`${summary.readiness_percent}% (${summary.ready_items_count}/${summary.total_items} item siap)`, margin + 3, cursorY + 11);
  doc.setFont('helvetica', 'normal').text('Total Biaya BOM:', margin + colW + 3, cursorY + 5);
  doc.setFont('helvetica', 'bold').text(formatRupiah(summary.total_bom_cost), margin + colW + 3, cursorY + 11);
  doc.setFont('helvetica', 'normal').text('Biaya Kekurangan:', margin + colW * 2 + 3, cursorY + 5);
  doc.setFont('helvetica', 'bold').text(formatRupiah(summary.missing_cost), margin + colW * 2 + 3, cursorY + 11);
  cursorY += 21;

  // 5. Tabel BOM
  const bomRows = (summary.items || []).map((it, idx) => [
    idx + 1, it.component_name || '-', it.category || '-', it.bin_location || '-',
    it.quantity_needed, it.stock_available, it.shortage_qty > 0 ? `-${it.shortage_qty}` : '0',
    formatRupiah(it.unit_price), formatRupiah(it.subtotal),
  ]);
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [['No', 'Komponen', 'Kategori', 'Lokasi', 'Butuh', 'Stok', 'Kurang', 'Harga Satuan', 'Subtotal']],
    body: bomRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, textColor: [30, 30, 30] },
    headStyles: { fillColor: [235, 235, 235], textColor: [20, 20, 20], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' }, 7: { halign: 'right' }, 8: { halign: 'right' } },
    didDrawCell: (d) => {
      if (d.section === 'body' && d.column.index === 6 && typeof d.cell.raw === 'string' && d.cell.raw.startsWith('-')) {
        doc.setTextColor(185, 28, 28);
      }
    },
  });
  cursorY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : cursorY) + 7;

  // 6. Tabel Belanja Kekurangan
  const shopList = summary.shopping_list || [];
  if (shopList.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(20, 20, 20);
    doc.text('Daftar Belanja Kekurangan Komponen', margin, cursorY);
    cursorY += 3.5;
    const shopRows = shopList.map((s, idx) => [idx + 1, s.component_name, `${s.shortage_qty} unit`, formatRupiah(s.shortage_cost)]);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['No', 'Komponen Kekurangan', 'Jumlah Kurang', 'Estimasi Biaya']],
      body: shopRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.8, textColor: [30, 30, 30] },
      headStyles: { fillColor: [254, 242, 242], textColor: [153, 27, 27], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] }, 3: { halign: 'right' } },
    });
    cursorY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : cursorY) + 7;
  }

  // 7. Dokumentasi Foto Proyek
  const photos = project.photos || [];
  if (photos.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(20, 20, 20);
    doc.text('Dokumentasi Foto Proyek', margin, cursorY);
    cursorY += 4.5;
    const colWPhoto = (contentW - 6) / 2;

    for (let i = 0; i < photos.length; i += 2) {
      checkPageBreak(52);
      const row = [photos[i], photos[i + 1]].filter(Boolean);
      let loadedRow = [];
      try {
        loadedRow = await Promise.all(row.map((p) => loadImageDataUrl(p.thumb_url ?? p.image_url)));
      } catch {
        loadedRow = [null, null];
      }

      for (let j = 0; j < row.length; j++) {
        const xPos = margin + j * (colWPhoto + 6);
        const boxH = 44;
        doc.setDrawColor(220, 220, 220).setFillColor(255, 255, 255).rect(xPos, cursorY, colWPhoto, boxH, 'FD');

        const loaded = loadedRow[j];
        if (loaded) {
          try {
            const aspect = loaded.width / loaded.height;
            const drawW = Math.min(colWPhoto - 4, (boxH - 8) * aspect);
            const drawH = drawW / aspect;
            doc.addImage(loaded.dataUrl, 'JPEG', xPos + (colWPhoto - drawW) / 2, cursorY + 2, drawW, drawH);
          } catch {
            // Jika ada error decoding gambar, tampilkan placeholder
            doc.setFont('helvetica', 'italic').setFontSize(7).setTextColor(150, 150, 150);
            doc.text('[Foto]', xPos + colWPhoto / 2, cursorY + 18, { align: 'center' });
          }
        } else {
          doc.setFont('helvetica', 'italic').setFontSize(7).setTextColor(150, 150, 150);
          doc.text('[Foto tidak tersedia]', xPos + colWPhoto / 2, cursorY + 18, { align: 'center' });
        }
        doc.setFont('helvetica', 'italic').setFontSize(7).setTextColor(80, 80, 80);
        const cap = `Gbr ${i + j + 1}: ${row[j].caption || 'Dokumentasi'}`;
        doc.text(cap.length > 38 ? `${cap.slice(0, 36)}...` : cap, xPos + colWPhoto / 2, cursorY + boxH - 2.5, { align: 'center' });
      }
      cursorY += 48;
    }
  }

  // 8. Footer Nomor Halaman
  const totalPages = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(200, 200, 200).setLineWidth(0.3).line(margin, pageH - margin + 2, margin + contentW, pageH - margin + 2);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(130, 130, 130);
    doc.text(`Dibuat dengan PartsBin — ${dateStr}`, margin, pageH - margin + 5.5);
    doc.text(`Halaman ${p} dari ${totalPages}`, margin + contentW, pageH - margin + 5.5, { align: 'right' });
  }

  const safeName = (project.name || 'Proyek').replace(/[/\\?%*:|"<>]/g, '-');
  doc.save(`PartsBin - ${safeName} - ${new Date().toISOString().split('T')[0]}.pdf`);
}
