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
