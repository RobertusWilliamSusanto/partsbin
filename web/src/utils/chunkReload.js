// Helper pemulihan sekali muat ulang saat chunk lazy gagal diunduh akibat deploy baru
export function reloadOnceForChunkError() {
  try {
    const key = 'partsbin_last_chunk_reload';
    const now = Date.now();
    const last = Number(sessionStorage.getItem(key) || 0);
    // Batasi muat ulang otomatis maksimal 1 kali dalam jendela 10 detik untuk mencegah loop
    if (!last || now - last > 10000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    // Abaikan kegagalan akses storage dan batalkan reload otomatis demi keamanan
  }
  return false;
}
