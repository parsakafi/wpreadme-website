/**
 * Generate site icons from src/icons/wordpress.svg.
 *
 * The script reads the SVG's actual viewBox dynamically, scales the mark to
 * fill 84 % of a square canvas, and composites it centered on transparent
 * (or white) backgrounds.
 *
 * Outputs → public/
 *   android-chrome-192x192.png   (transparent)
 *   android-chrome-512x512.png   (transparent)
 *   favicon-16x16.png            (transparent)
 *   favicon-32x32.png            (transparent)
 *   apple-touch-icon.png         (white bg, iOS convention)
 *   favicon.ico                  (PNG-embedded 16/32/48 frames)
 *
 * Outputs → public/images/
 *   logo.png                     (512×512, same as android-chrome-512)
 *
 * Run:  node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SVG_PATH = path.join(ROOT, 'src', 'icons', 'wordpress.svg');
const SVG_RAW = readFileSync(SVG_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Parse viewBox from the SVG so we never hard-code dimensions.
// ---------------------------------------------------------------------------
function parseViewBox(svg) {
    const m = svg.match(/viewBox\s*=\s*"([^"]+)"/);
    if (!m) throw new Error('Cannot find viewBox in SVG');
    const [x, y, w, h] = m[1].trim().split(/[\s,]+/).map(Number);
    return {x, y, w, h};
}

const {w: SVG_W, h: SVG_H} = parseViewBox(SVG_RAW);
const SVG_BUFFER = Buffer.from(SVG_RAW);

/** Fraction of the canvas height the mark should occupy. */
const MARK_FILL = 0.84;

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/** Scale the SVG so it spans MARK_FILL of `canvasSize`, return PNG buffer + dimensions. */
async function renderMark(canvasSize) {
    const h = Math.round(canvasSize * MARK_FILL);
    const w = Math.round((h * SVG_W) / SVG_H);
    const png = await sharp(SVG_BUFFER, {density: 300}).resize(w, h).png().toBuffer();
    return {png, w, h};
}

/** Composite the mark centered on a `size × size` canvas. */
async function makeIcon(size, {background = null, grayscale = false} = {}) {
    const {png, w, h} = await renderMark(size);
    let layer = png;
    if (grayscale) {
        layer = await sharp(layer).grayscale().png().toBuffer();
    }
    const bg = background ?? {r: 0, g: 0, b: 0, alpha: 0};
    return sharp({create: {width: size, height: size, channels: 4, background: bg}})
        .composite([{input: layer, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2)}])
        .png()
        .toBuffer();
}

// ---------------------------------------------------------------------------
// ICO assembler (PNG-embedded frames, supported by all modern browsers)
// ---------------------------------------------------------------------------

function makeIco(entries) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);   // reserved
    header.writeUInt16LE(1, 2);   // type: icon
    header.writeUInt16LE(entries.length, 4);

    const dirs = [];
    const blobs = [];
    let offset = 6 + entries.length * 16;

    for (const {size, png} of entries) {
        const dir = Buffer.alloc(16);
        dir[0] = size >= 256 ? 0 : size; // width  (0 = 256)
        dir[1] = size >= 256 ? 0 : size; // height
        dir[2] = 0;  // palette
        dir[3] = 0;  // reserved
        dir.writeUInt16LE(1, 4);   // colour planes
        dir.writeUInt16LE(32, 6);  // bits per pixel
        dir.writeUInt32LE(png.length, 8);
        dir.writeUInt32LE(offset, 12);
        offset += png.length;
        dirs.push(dir);
        blobs.push(png);
    }

    return Buffer.concat([header, ...dirs, ...blobs]);
}

// ---------------------------------------------------------------------------
// Generate all icons
// ---------------------------------------------------------------------------

const jobs = [
    ['android-chrome-192x192.png', 192, {}],
    ['android-chrome-512x512.png', 512, {}],
    ['favicon-16x16.png',          16,  {}],
    ['favicon-32x32.png',          32,  {}],
    ['apple-touch-icon.png',       180, {background: {r: 255, g: 255, b: 255, alpha: 1}}],
];

for (const [name, size, opts] of jobs) {
    const out = path.join(PUBLIC, name);
    const png = await makeIcon(size, opts);
    writeFileSync(out, png);
    console.log(`✓ ${name}  ${size}×${size}  ${(png.length / 1024).toFixed(1)} KB`);
}

// favicon.ico: 16 / 32 / 48
const icoFrames = [];
for (const size of [16, 32, 48]) {
    icoFrames.push({size, png: await makeIcon(size)});
}
const ico = makeIco(icoFrames);
writeFileSync(path.join(PUBLIC, 'favicon.ico'), ico);
console.log(`✓ favicon.ico  (16/32/48)  ${(ico.length / 1024).toFixed(1)} KB`);

// logo.png, same art as android-chrome-512
const logo = await makeIcon(512);
const logoPath = path.join(ROOT, 'public', 'images', 'logo.png');
writeFileSync(logoPath, logo);
console.log(`✓ images/logo.png  512×512  ${(logo.length / 1024).toFixed(1)} KB`);

console.log(`\nDone. All icons generated from wordpress.svg (${SVG_W}×${SVG_H} viewBox).`);
