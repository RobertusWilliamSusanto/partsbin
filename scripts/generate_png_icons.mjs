import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper CRC32 untuk pembuatan chunk PNG standar ISO/IEC 15948
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

function calcCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calcCrc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function generateIconPng(size) {
  const width = size;
  const height = size;
  const scanlines = Buffer.alloc(height * (1 + width * 4));

  // Warna-warna tema solid (Precision Cobalt Slate)
  const bg = [11, 15, 23, 255];          // #0b0f17
  const chipBg = [30, 41, 59, 255];      // #1e293b
  const accent = [56, 189, 248, 255];    // #38bdf8 (Sky cyan)
  const cobalt = [2, 132, 199, 255];     // #0284c7 (Cobalt primary)
  const pin1Dot = [148, 163, 184, 255];  // #94a3b8

  const cx = width / 2;
  const cy = height / 2;

  // Dimensi badan IC (dalam safe zone 80%)
  const bodyMinX = Math.round(width * 0.28);
  const bodyMaxX = Math.round(width * 0.72);
  const bodyMinY = Math.round(height * 0.28);
  const bodyMaxY = Math.round(height * 0.72);
  const borderWidth = Math.max(2, Math.round(width * 0.015));

  // Posisi pin (4 pin di tiap sisi)
  const pinOffsets = [0.36, 0.45, 0.55, 0.64].map((p) => Math.round(width * p));
  const pinThickness = Math.max(2, Math.round(width * 0.03));
  const pinExt = Math.round(width * 0.10); // panjang pin dari badan chip

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      let col = bg;

      // 1. Gambar Pin IC (Horizontal & Vertikal)
      for (const p of pinOffsets) {
        const halfT = Math.floor(pinThickness / 2);
        // Pin Atas
        if (x >= p - halfT && x <= p + halfT && y >= bodyMinY - pinExt && y <= bodyMinY) {
          col = accent;
        }
        // Pin Bawah
        if (x >= p - halfT && x <= p + halfT && y >= bodyMaxY && y <= bodyMaxY + pinExt) {
          col = accent;
        }
        // Pin Kiri
        if (y >= p - halfT && y <= p + halfT && x >= bodyMinX - pinExt && x <= bodyMinX) {
          col = accent;
        }
        // Pin Kanan
        if (y >= p - halfT && y <= p + halfT && x >= bodyMaxX && x <= bodyMaxX + pinExt) {
          col = accent;
        }
      }

      // 2. Gambar Badan Chip IC
      if (x >= bodyMinX && x <= bodyMaxX && y >= bodyMinY && y <= bodyMaxY) {
        // Cek border badan IC
        const isBorder =
          x < bodyMinX + borderWidth ||
          x > bodyMaxX - borderWidth ||
          y < bodyMinY + borderWidth ||
          y > bodyMaxY - borderWidth;

        if (isBorder) {
          col = accent;
        } else {
          col = chipBg;

          // 3. Elemen Interior Chip
          // Inti mikroprosesor di tengah
          const coreMin = Math.round(width * 0.43);
          const coreMax = Math.round(width * 0.57);
          const isCoreBorder =
            (x >= coreMin && x <= coreMax && (y === coreMin || y === coreMax || y === coreMin + 1 || y === coreMax - 1)) ||
            (y >= coreMin && y <= coreMax && (x === coreMin || x === coreMax || x === coreMin + 1 || x === coreMax - 1));

          if (isCoreBorder) {
            col = cobalt;
          }

          // Titik pusat
          const distCenter = Math.hypot(x - cx, y - cy);
          if (distCenter <= width * 0.035) {
            col = accent;
          }

          // Titik Pin 1 (Indikator orientasi IC)
          const p1x = Math.round(width * 0.35);
          const p1y = Math.round(height * 0.35);
          const distP1 = Math.hypot(x - p1x, y - p1y);
          if (distP1 <= width * 0.02) {
            col = pin1Dot;
          }
        }
      }

      scanlines[pxOffset] = col[0];
      scanlines[pxOffset + 1] = col[1];
      scanlines[pxOffset + 2] = col[2];
      scanlines[pxOffset + 3] = col[3];
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', zlib.deflateSync(scanlines));
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const outDir = path.resolve(__dirname, '../web/public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const p192 = path.join(outDir, 'icon-192.png');
const p512 = path.join(outDir, 'icon-512.png');

const buf192 = generateIconPng(192);
const buf512 = generateIconPng(512);

fs.writeFileSync(p192, buf192);
fs.writeFileSync(p512, buf512);

console.log(`Berhasil membuat icon-192.png (${buf192.length} bytes) di ${p192}`);
console.log(`Berhasil membuat icon-512.png (${buf512.length} bytes) di ${p512}`);
