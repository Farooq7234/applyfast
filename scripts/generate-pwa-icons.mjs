import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, getPixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    let i = y * (width * 4 + 1);
    raw[i++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      raw[i++] = r;
      raw[i++] = g;
      raw[i++] = b;
      raw[i++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function roundedRectContains(x, y, size, radius) {
  if (x < 0 || y < 0 || x >= size || y >= size) return false;
  if (x >= radius && x < size - radius) return true;
  if (y >= radius && y < size - radius) return true;
  const corners = [
    [radius, radius],
    [size - radius, radius],
    [radius, size - radius],
    [size - radius, size - radius],
  ];
  return corners.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
}

function boltPoly(size, insetRatio) {
  const inset = size * insetRatio;
  const s = size - inset * 2;
  const map = (x, y) => [inset + (x / 24) * s, inset + (y / 24) * s];
  return [
    map(13, 2),
    map(3.5, 13.2),
    map(11, 13.2),
    map(11, 22),
    map(20.5, 10.8),
    map(13, 10.8),
  ];
}

function drawIcon(size, { maskable }) {
  const bg = [117, 45, 38, 255];
  const fg = [255, 255, 255, 255];
  const empty = [0, 0, 0, 0];
  const radius = size * 0.22;
  const insetRatio = maskable ? 0.28 : 0.22;
  const poly = boltPoly(size, insetRatio);

  return encodePng(size, size, (x, y) => {
    if (!maskable && !roundedRectContains(x, y, size, radius)) return empty;
    if (pointInPoly(x + 0.5, y + 0.5, poly)) return fg;
    return bg;
  });
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const files = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-192.png", 192, true],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, false],
];

for (const [name, size, maskable] of files) {
  writeFileSync(join(outDir, name), drawIcon(size, { maskable }));
}

console.log(`Wrote ${files.length} icons to ${outDir}`);
