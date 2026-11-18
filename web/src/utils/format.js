const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatRupiah(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return rupiahFormatter.format(0);
  return rupiahFormatter.format(num);
}
