import { formatRupiah } from '../utils/format';

// Subkomponen tabel rincian BOM dan daftar kekurangan pada dokumen cetak A4
export default function ProjectDocumentBom({ items = [], shoppingList = [] }) {
  return (
    <>
      <h2 className="print-doc__section-title">Daftar Kebutuhan Komponen (BOM)</h2>
      <table className="print-doc__table">
        <thead>
          <tr>
            <th style={{ width: '32px' }}>No</th>
            <th>Komponen</th>
            <th>Kategori</th>
            <th style={{ width: '60px' }}>Butuh</th>
            <th style={{ width: '60px' }}>Stok</th>
            <th style={{ width: '60px' }}>Kurang</th>
            <th style={{ width: '90px' }}>Harga Satuan</th>
            <th style={{ width: '100px' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', color: '#666666' }}>
                Belum ada komponen di dalam daftar BOM proyek ini.
              </td>
            </tr>
          ) : (
            items.map((it, idx) => {
              const comp = it.components || it.component || {};
              const category = comp.category || it.category || '-';
              return (
                <tr key={it.id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td><strong>{it.component_name || comp.name || '-'}</strong></td>
                  <td>{category}</td>
                  <td className="print-doc__num">{it.quantity_needed}</td>
                  <td className="print-doc__num">{it.stock_available}</td>
                  <td className="print-doc__num" style={{ color: it.shortage_qty > 0 ? '#b91c1c' : '#000000', fontWeight: it.shortage_qty > 0 ? '700' : 'normal' }}>
                    {it.shortage_qty}
                  </td>
                  <td className="print-doc__num">{formatRupiah(it.unit_price)}</td>
                  <td className="print-doc__num">{formatRupiah(it.subtotal)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {shoppingList && shoppingList.length > 0 && (
        <>
          <h2 className="print-doc__section-title">Daftar Belanja Kekurangan Komponen</h2>
          <table className="print-doc__table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}>No</th>
                <th>Komponen</th>
                <th>Lokasi Bin</th>
                <th style={{ width: '80px' }}>Jumlah Kurang</th>
                <th style={{ width: '100px' }}>Estimasi Biaya</th>
              </tr>
            </thead>
            <tbody>
              {shoppingList.map((shop, idx) => (
                <tr key={shop.component_id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td><strong>{shop.component_name}</strong></td>
                  <td>{shop.bin_location}</td>
                  <td className="print-doc__num" style={{ color: '#b91c1c', fontWeight: '700' }}>{shop.shortage_qty}</td>
                  <td className="print-doc__num">{formatRupiah(shop.shortage_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
