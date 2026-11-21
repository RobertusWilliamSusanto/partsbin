// Utilitas murni untuk menghitung pagination data array di sisi browser
// Kenapa dibuat fungsi murni terpisah? Agar mudah diuji secara deterministik tanpa mock React hook.
export function paginate(items, page = 1, pageSize = 6) {
  const safeItems = Array.isArray(items) ? items : [];
  const total = safeItems.length;
  const safePageSize = Math.max(1, Math.floor(Number(pageSize) || 6));
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  // Validasi page: tangani string angka, NaN, null, desimal, nilai negatif, dan 0
  let parsedPage = Number(page);
  if (Number.isNaN(parsedPage) || !Number.isFinite(parsedPage) || parsedPage < 1) {
    parsedPage = 1;
  } else {
    parsedPage = Math.floor(parsedPage);
  }

  // Batasi rentang (clamp) ke [1, totalPages]
  const safePage = Math.min(Math.max(1, parsedPage), totalPages);

  // Jika item kosong, kembalikan pagination kosong dengan aman
  if (total === 0) {
    return {
      page: 1,
      totalPages: 1,
      pageItems: [],
      total: 0,
      from: 0,
      to: 0,
    };
  }

  const startIndex = (safePage - 1) * safePageSize;
  const pageItems = safeItems.slice(startIndex, startIndex + safePageSize);
  const from = startIndex + 1;
  const to = Math.min(startIndex + pageItems.length, total);

  return {
    page: safePage,
    totalPages,
    pageItems,
    total,
    from,
    to,
  };
}
