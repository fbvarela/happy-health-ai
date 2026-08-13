// Generates PWA icons — red medical cross on a warm background (SPEC §13).
import sharp from "sharp";

const SIZES = [
  { file: "public/icons/icon-192.png", size: 192, maskable: false },
  { file: "public/icons/icon-512.png", size: 512, maskable: false },
  { file: "public/icons/icon-maskable-192.png", size: 192, maskable: true },
  { file: "public/icons/icon-maskable-512.png", size: 512, maskable: true },
  { file: "public/icons/apple-touch-icon.png", size: 180, maskable: false },
];

const BG = "#3d2b1f"; // bark — matches theme_color
const CROSS = "#e0564a"; // red cross
const WHITE = "#ffffff";

// Maskable needs a safe zone: draw the cross smaller (60% of canvas).
async function draw(size, maskable) {
  const safe = maskable ? 0.62 : 0.72; // cross size relative to canvas
  const crossW = Math.round(size * safe);
  const arm = Math.round(crossW / 3.2); // width of each bar
  const cx = Math.round(size / 2);
  const cy = Math.round(size / 2);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BG}"/>
      <rect x="${cx - crossW / 2}" y="${cy - arm / 2}" width="${crossW}" height="${arm}" fill="${CROSS}"/>
      <rect x="${cx - arm / 2}" y="${cy - crossW / 2}" width="${arm}" height="${crossW}" fill="${CROSS}"/>
      <rect x="${cx - arm / 2}" y="${cy - arm / 2}" width="${arm}" height="${arm}" fill="${WHITE}"/>
    </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

for (const { file, size, maskable } of SIZES) {
  await sharp(await draw(size, maskable)).toFile(file);
  console.log("wrote", file);
}
