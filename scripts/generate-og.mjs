/**
 * Generate the default Open Graph image for the site.
 *
 * Run with: node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images');

const VIOLET = '#3ab4ed';
const INK = '#111827';
const SLATE = '#4B5563';
const MUTED = '#6B7280';
const FAINT = '#9CA3AF';
const W = 1200;
const H = 630;
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

mkdirSync(OUT_DIR, {recursive: true});

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EDE9FE"/>
      <stop offset="100%" stop-color="#FEFEFF"/>
    </linearGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1050" cy="30" r="300" fill="url(#glow1)"/>
  <circle cx="110" cy="620" r="340" fill="url(#glow2)"/>
  <text x="84" y="320" font-family="${FONT}" font-size="72" font-weight="800" fill="${INK}">WPReadme</text>
  <text x="84" y="390" font-family="${FONT}" font-size="72" font-weight="800" fill="${INK}">Preview</text>
  <text x="84" y="460" font-family="${FONT}" font-size="30" font-weight="400" fill="${SLATE}">Preview your WordPress plugin readme.txt before publishing</text>
  <line x1="84" y1="510" x2="1116" y2="510" stroke="#E4DCFB" stroke-width="2"/>
  <text x="84" y="555" font-family="${FONT}" font-size="30">
    <tspan font-weight="800" fill="${INK}">WPReadme</tspan> <tspan font-weight="400" fill="${MUTED}">Preview</tspan>
  </text>
  <text x="1116" y="555" text-anchor="end" font-family="${FONT}" font-size="26" font-weight="400" fill="${FAINT}">wpreadme.ir</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
const out = path.join(OUT_DIR, 'og-default.png');
writeFileSync(out, png);
const meta = await sharp(png).metadata();
console.log(`✓ ${out}  ${meta.width}x${meta.height}  ${(png.length / 1024).toFixed(1)} KB`);
