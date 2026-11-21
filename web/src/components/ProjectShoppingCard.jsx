import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Share2, Check } from 'lucide-react';
import { formatRupiah } from '../utils/format';

// Kartu daftar belanja komponen defisit (Shopping Deficit) dengan fitur Web Share API & Clipboard Fallback
export default function ProjectShoppingCard({
  projectName = '',
  shoppingList = [],
  missingCost = 0,
  onToast,
}) {
  const [copied, setCopied] = useState(false);
  const isEmpty = shoppingList.length === 0;

  const handleShare = async () => {
    if (isEmpty) return;

    const lines = shoppingList.map(
      (shop) =>
        `- ${shop.component_name} [${shop.bin_location}]: Kurang ${shop.shortage_qty} pcs (@ ${formatRupiah(shop.unit_price)}) = ${formatRupiah(
          shop.shortage_qty * shop.unit_price
        )}`
    );

    const shareText = `Daftar Belanja: ${projectName || 'Proyek PartsBin'}\n${lines.join('\n')}\nTotal Estimasi: ${formatRupiah(missingCost)}`;

    // 1. Coba Web Share API bawaan perangkat mobile
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Daftar Belanja ${projectName || 'Proyek'}`,
          text: shareText,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // Pengguna membatalkan dialog share
      }
    }

    // 2. Fallback salin ke clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onToast) {
        onToast('Daftar belanja berhasil disalin ke clipboard!');
      }
    } catch {
      if (onToast) {
        onToast('Gagal menyalin daftar belanja ke clipboard.');
      }
    }
  };

  return (
    <div className="card stack-md">
      <div className="card-head">
        <div className="row-wrap" style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
          <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
          <h2 className="card-title">Daftar Belanja (Shopping Deficit)</h2>
        </div>
        <span className={`chip chip--${isEmpty ? 'ok' : 'danger'}`}>
          {isEmpty ? 'Lengkap' : `${shoppingList.length} item`}
        </span>
      </div>

      {isEmpty ? (
        <p className="count" style={{ margin: '4px 0' }}>
          Seluruh komponen terpenuhi dari stok inventaris meja kerja. Tidak ada kekurangan belanja.
        </p>
      ) : (
        <ul className="stock">
          {shoppingList.map((shop) => (
            <li key={shop.item_id || shop.component_id} className="spec-cell">
              <div className="card-head">
                <Link to={`/components/${shop.component_id}`} className="card-title">
                  {shop.component_name}
                </Link>
                <span className="mono-badge">{shop.bin_location}</span>
              </div>
              <div className="row-between" style={{ marginTop: 4 }}>
                <span className="count">
                  Kurang {shop.shortage_qty} pcs × {formatRupiah(shop.unit_price)}
                </span>
                <span className="price">
                  {formatRupiah(shop.estimated_cost || shop.shortage_qty * shop.unit_price)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="row-between" style={{ paddingTop: 4 }}>
        <span className="form-label" style={{ margin: 0 }}>Total Estimasi Belanja</span>
        <span className="price">{formatRupiah(missingCost)}</span>
      </div>

      <button
        type="button"
        className="btn btn--outline"
        style={{ minHeight: 44, width: '100%', marginTop: 4 }}
        onClick={handleShare}
        disabled={isEmpty}
        aria-label="Bagikan daftar belanja ke aplikasi lain atau salin teks"
      >
        {copied ? (
          <Check size={18} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
        <span>{copied ? 'Tersalin ke Clipboard!' : 'Bagikan Daftar Belanja'}</span>
      </button>
    </div>
  );
}
