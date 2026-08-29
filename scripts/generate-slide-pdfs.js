#!/usr/bin/env node

/**
 * Generate a downloadable PDF for each Marp slide deck in src/content/slides/.
 * Output is placed in public/slides/ for static serving (e.g. /slides/welcome.pdf).
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import puppeteer from 'puppeteer';
import { renderSlides } from '../src/utils/marp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const slidesDir = join(projectRoot, 'src', 'content', 'slides');
const outDir = join(projectRoot, 'public', 'slides');

console.log('🖥️  Generating slide deck PDFs...');

if (!existsSync(slidesDir)) {
  console.log('ℹ️  No slide decks found, skipping.');
  process.exit(0);
}

const deckFiles = readdirSync(slidesDir).filter((file) => file.endsWith('.md'));

if (deckFiles.length === 0) {
  console.log('ℹ️  No slide decks found, skipping.');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

try {
  console.log('🌐 Ensuring Puppeteer Chrome build is installed...');
  execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const file of deckFiles) {
    const slug = basename(file, '.md');
    const rawMarkdown = readFileSync(join(slidesDir, file), 'utf-8');
    const { html, css } = renderSlides(rawMarkdown);

    const document = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; }
      .marpit > svg[data-marpit-svg] { display: block; width: 1280px; height: 720px; break-after: page; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;

    const page = await browser.newPage();
    await page.setContent(document, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: join(outDir, `${slug}.pdf`),
      width: '1280px',
      height: '720px',
      printBackground: true,
    });
    await page.close();

    console.log(`📦 Generated ${slug}.pdf`);
  }

  await browser.close();

  console.log('✅ Slide deck PDFs generated successfully!');
} catch (error) {
  console.error('❌ Error generating slide deck PDFs:', error.message);
  process.exit(1);
}
