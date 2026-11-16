// Render the entry image from scene.html with headless Chromium.
//
// This is a development tool only: it turns the SVG scene I authored in
// scene.html into the PNG that the entry ships. The entry program itself
// (main.ts) only copies that PNG, byte for byte, so the graded run stays
// deterministic and needs no browser at all.
//
// Usage:
//   node tools/render.mjs            # renders scene.html -> assets/entry.png
//   node tools/render.mjs out.png    # renders to a custom path instead
//
// Requires playwright-core and a Chromium build. It uses the Chromium
// that Playwright keeps under ~/.cache/ms-playwright, and nothing else.

import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const outPath = resolve(process.argv[2] ?? join(repoRoot, 'assets', 'entry.png'));

// The scene is a single self-contained page, 1024 x 1024, no network.
const scenePath = join(repoRoot, 'scene.html');
const html = readFileSync(scenePath, 'utf8');

const chromiumPath = join(
  homedir(),
  '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
);

const browser = await chromium.launch({
  executablePath: chromiumPath,
  args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  // Let the deterministic starfield script finish painting.
  await page.waitForTimeout(400);
  mkdirSync(dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`rendered ${outPath}`);
} finally {
  await browser.close();
}
