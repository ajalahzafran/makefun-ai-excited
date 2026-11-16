// ai-excited-01 entry: "The Whale That Swallowed the Sky"
//
// A colossal whale made of stars, breaching out of a dark ocean into the
// night sky, watched by one tiny lantern-lit boat. The image itself was
// authored as a vector scene in scene.html and rendered once, ahead of
// time, to assets/entry.png (see tools/render.mjs for how).
//
// This program does exactly one thing, deterministically: it copies that
// finished image, byte for byte, to the grader's output directory, so
// both runs of the entry write the same bytes. It uses only the Node
// standard library, makes no network request, and reads nothing outside
// its own repository.
//
// Run it locally the way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The image shipped in this repository, next to this file.
const source = fileURLToPath(new URL('./assets/entry.png', import.meta.url));

// The gate, as the kit's RULES.txt states it: a whole PNG of at most
// 1 MiB and at most 1024 by 1024 pixels. Check it here, before writing,
// so a broken image fails loudly instead of entering silently.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;
const MAX_SIDE = 1024;

const bytes = readFileSync(source);
if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error('entry image is not a PNG');
}
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry image is ${bytes.length} bytes, over the 1 MiB limit`);
}
// The IHDR chunk: width at bytes 16-19, height at 20-23, big-endian.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry image is ${width}x${height}, over the 1024x1024 limit`);
}
if (statSync(source).size !== bytes.length) {
  throw new Error('entry image changed while being read');
}

// The grader gives us /output; outside the container the environment
// variable stands in for it, exactly as the kit's RULES.txt describes.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

console.log(`wrote ${target} (${bytes.length} bytes, ${width}x${height})`);
