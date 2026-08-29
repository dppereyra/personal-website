import { describe, it, expect } from 'vitest';
import { formatDate, formatMonthYear, parseDateValue, sortByDate } from './formatDate';

describe('formatDate', () => {
  it('formats a date correctly', () => {
    const date = new Date('2026-02-03');
    const formatted = formatDate(date);
    expect(formatted).toBe('February 3, 2026');
  });

  it('respects locale parameter', () => {
    const date = new Date('2026-02-03');
    const formatted = formatDate(date, 'es-ES');
    expect(formatted).toContain('febrero');
  });

  it('formats date-only strings consistently', () => {
    expect(formatDate('2026-02-03')).toBe('February 3, 2026');
  });
});

describe('formatMonthYear', () => {
  it('formats year-month strings consistently', () => {
    expect(formatMonthYear('2024-08')).toBe('August 2024');
  });
});

describe('parseDateValue', () => {
  it('parses partial ISO dates in UTC-safe form', () => {
    const parsed = parseDateValue('2024-08');
    expect(parsed.toISOString()).toBe('2024-08-01T00:00:00.000Z');
  });
});

describe('sortByDate', () => {
  it('sorts posts by date in descending order', () => {
    const posts = [
      { data: { pubDate: new Date('2026-01-01') }, slug: 'post1' },
      { data: { pubDate: new Date('2026-03-01') }, slug: 'post2' },
      { data: { pubDate: new Date('2026-02-01') }, slug: 'post3' },
    ];

    const sorted = sortByDate(posts);

    expect(sorted[0].slug).toBe('post2'); // March (newest)
    expect(sorted[1].slug).toBe('post3'); // February
    expect(sorted[2].slug).toBe('post1'); // January (oldest)
  });

  it('handles empty array', () => {
    const sorted = sortByDate([]);
    expect(sorted).toEqual([]);
  });
});
