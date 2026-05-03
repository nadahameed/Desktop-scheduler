// Generate a rounded macOS icon from icons/schedulericon.jpeg
// electron-builder will convert the PNG to .icns automatically

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function main() {
  const src = path.resolve(__dirname, '..', 'icons', 'schedulericon.jpeg');
  const outDir = path.resolve(__dirname, '..', 'build');
  fs.mkdirSync(outDir, { recursive: true });

  // Create a properly sized rounded icon (512x512 is a good balance)
  const size = 512;
  const radius = Math.round(size * 0.223); // approximate Apple rounded corner ratio
  const rounded = await sharp(src)
    .resize(size, size)
    .composite([{ input: await roundedMask(size, radius), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const outPng = path.join(outDir, 'icon.png');
  fs.writeFileSync(outPng, rounded);
  console.log('Generated build/icon.png (electron-builder will convert to .icns)');
}

async function roundedMask(size, radius) {
  // Create an SVG rounded-rect mask
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#000"/>
    </svg>`
  );
  return await sharp(svg).png().toBuffer();
}

main().catch(err => { console.error(err); process.exit(1); });


