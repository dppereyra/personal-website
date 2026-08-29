import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Marp } from '@marp-team/marp-core';

// Read via plain Node fs (relative to the project root) rather than a Vite
// `?raw` import: the project's @tailwindcss/vite plugin intercepts every
// .css import (raw query included) and would otherwise hand back
// empty/processed content instead of the literal Marp theme source.
const themeCssPath = join(process.cwd(), 'src/styles/marp-themes/wave.css');
const waveThemeCss = readFileSync(themeCssPath, 'utf-8');

/**
 * Render raw Marp markdown (including its YAML front matter, so directives
 * like `theme:`/`paginate:` are honored) into deck HTML and CSS.
 */
export function renderSlides(rawMarkdown: string): { html: string; css: string } {
  const marp = new Marp({ inlineSVG: true });
  marp.themeSet.add(waveThemeCss);
  return marp.render(rawMarkdown);
}
