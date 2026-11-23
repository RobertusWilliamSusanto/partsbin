// Menjalankan promise dengan tenggat waktu 2500 ms dan membersihkan timer
export function withTimeout(promise, timeoutMs = 2500) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timeout offline')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
