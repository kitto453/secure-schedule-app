/**
 * Script to generate PWA icons using the 'canvas' package.
 * Run: node generate-icons.js
 * Requires: npm install canvas (one-time, not a project dependency)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#6366f1';
  // Rounded rectangle background
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Letter "S"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.55)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2 + size * 0.03);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${size}x${size})`);
}

const iconsDir = path.join(__dirname, 'frontend', 'public', 'icons');

try {
  generateIcon(192, path.join(iconsDir, 'icon-192.png'));
  generateIcon(512, path.join(iconsDir, 'icon-512.png'));
  console.log('\nIcons generated successfully!');
} catch (err) {
  console.error('Error generating icons. Make sure to install canvas: npm install canvas');
  console.error(err.message);
  process.exit(1);
}
