import { describe, it, expect } from 'vitest';
import { renderSlides } from './marp';

const fixture = `---
marp: true
theme: wave
paginate: true
---

# First Slide

Hello world

---

## Second Slide

- point one
- point two
`;

describe('renderSlides', () => {
  it('renders one marpit container with a slide per --- separator', () => {
    const { html } = renderSlides(fixture);
    expect(html).toContain('class="marpit"');
    const slideCount = (html.match(/<svg data-marpit-svg/g) ?? []).length;
    expect(slideCount).toBe(2);
  });

  it('includes the slide content in the rendered output', () => {
    const { html } = renderSlides(fixture);
    expect(html).toContain('First Slide');
    expect(html).toContain('Second Slide');
    expect(html).toContain('point one');
  });

  it('applies the wave theme', () => {
    const { html, css } = renderSlides(fixture);
    expect(html).toContain('data-theme="wave"');
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain('wave');
  });

  it('respects the paginate directive', () => {
    const { html } = renderSlides(fixture);
    expect(html).toContain('data-paginate="true"');
    expect(html).toContain('data-marpit-pagination-total="2"');
  });
});

const aiAssistedFixture = `---
marp: true
theme: wave
paginate: true
title: 'Deck'
ai-assisted: true
---

# First Slide

---

# Second Slide
`;

describe('renderSlides ai-assisted marker', () => {
  it('marks every slide when the deck front matter sets ai-assisted: true', () => {
    const { html } = renderSlides(aiAssistedFixture);
    const marked = (html.match(/<section[^>]*class="[^"]*\bai-assisted\b[^"]*"/g) ?? []).length;
    expect(marked).toBe(2);
  });

  it('leaves slides unmarked when ai-assisted is absent', () => {
    const { html } = renderSlides(fixture);
    expect(html).not.toMatch(/<section[^>]*class="[^"]*\bai-assisted\b/);
  });

  it('leaves slides unmarked when ai-assisted is explicitly false', () => {
    const { html } = renderSlides(aiAssistedFixture.replace('ai-assisted: true', 'ai-assisted: false'));
    expect(html).not.toMatch(/<section[^>]*class="[^"]*\bai-assisted\b/);
  });

  it('appends to an existing class directive rather than replacing it', () => {
    const withClass = aiAssistedFixture.replace(
      'ai-assisted: true',
      "class: lead\nai-assisted: true"
    );
    const { html } = renderSlides(withClass);
    const first = html.match(/<section[^>]*>/)?.[0] ?? '';
    expect(first).toMatch(/\blead\b/);
    expect(first).toMatch(/\bai-assisted\b/);
  });

  it('does not duplicate the marker when the deck already declares it', () => {
    const alreadyMarked = aiAssistedFixture.replace(
      'ai-assisted: true',
      "class: ai-assisted\nai-assisted: true"
    );
    const { html } = renderSlides(alreadyMarked);
    const first = html.match(/<section[^>]*class="([^"]*)"/)?.[1] ?? '';
    const occurrences = (first.match(/\bai-assisted\b/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('carries the marker into the theme-styled output so the footer can render', () => {
    const { css } = renderSlides(aiAssistedFixture);
    expect(css).toContain('ai-assisted');
  });
});
