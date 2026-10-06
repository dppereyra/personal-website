import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Marp } from '@marp-team/marp-core';

// Read via plain Node fs (relative to the project root) rather than a Vite
// `?raw` import: the project's @tailwindcss/vite plugin intercepts every
// .css import (raw query included) and would otherwise hand back
// empty/processed content instead of the literal Marp theme source.
const themeCssPath = join(process.cwd(), 'src/styles/marp-themes/wave.css');
const waveThemeCss = readFileSync(themeCssPath, 'utf-8');

/** Class the theme hangs the "AI-assisted" slide footer off. */
const AI_ASSISTED_CLASS = 'ai-assisted';

const FRONT_MATTER_RE = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
const AI_ASSISTED_RE = /^ai-assisted[ \t]*:[ \t]*true[ \t]*$/im;
const CLASS_LINE_RE = /^class[ \t]*:[ \t]*(.*)$/im;

/**
 * `ai-assisted: true` is a content-collection field, not a Marp directive, so
 * Marp ignores it. Translate it into Marp's own `class` global directive,
 * which tags every `<section>` and lets the theme render the footer.
 *
 * Appends to an existing `class:` rather than replacing it, so a deck can set
 * its own classes (and its own `footer:`) without losing either.
 */
function withAiAssistedClass(rawMarkdown: string): string {
  const frontMatter = rawMarkdown.match(FRONT_MATTER_RE);
  if (!frontMatter) return rawMarkdown;

  const [matched, open, body, close] = frontMatter;
  if (!AI_ASSISTED_RE.test(body)) return rawMarkdown;

  const existingClass = body.match(CLASS_LINE_RE);
  let nextBody: string;

  if (existingClass) {
    const classes = existingClass[1]
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .split(/\s+/)
      .filter(Boolean);
    if (classes.includes(AI_ASSISTED_CLASS)) return rawMarkdown;
    classes.push(AI_ASSISTED_CLASS);
    nextBody = body.replace(CLASS_LINE_RE, `class: ${classes.join(' ')}`);
  } else {
    nextBody = `${body}\nclass: ${AI_ASSISTED_CLASS}`;
  }

  return `${open}${nextBody}${close}${rawMarkdown.slice(matched.length)}`;
}

/**
 * Render raw Marp markdown (including its YAML front matter, so directives
 * like `theme:`/`paginate:` are honored) into deck HTML and CSS.
 */
export function renderSlides(rawMarkdown: string): { html: string; css: string } {
  const marp = new Marp({ inlineSVG: true });
  marp.themeSet.add(waveThemeCss);
  return marp.render(withAiAssistedClass(rawMarkdown));
}
