const sharp = require('sharp');
const fs = require('fs');

fs.mkdirSync('public/icons', { recursive: true });

const svg = (size) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#111111"/>
    <text x="50%" y="54%" font-family="sans-serif" font-size="${Math.round(size * 0.4)}" font-weight="bold" fill="#FF601A" text-anchor="middle" dominant-baseline="middle">918</text>
  </svg>`
);

sharp(svg(192)).png().toFile('public/icons/icon-192.png', (e) => console.log(e || 'icon-192.png ok'));
sharp(svg(512)).png().toFile('public/icons/icon-512.png', (e) => console.log(e || 'icon-512.png ok'));
