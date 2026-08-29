const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const YEAR_ONLY_PATTERN = /^(\d{4})$/;

export function parseDateValue(value: Date | string): Date {
  if (value instanceof Date) {
    return value;
  }

  const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const yearMonthMatch = value.match(YEAR_MONTH_PATTERN);
  if (yearMonthMatch) {
    const [, year, month] = yearMonthMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  }

  const yearOnlyMatch = value.match(YEAR_ONLY_PATTERN);
  if (yearOnlyMatch) {
    const [, year] = yearOnlyMatch;
    return new Date(Date.UTC(Number(year), 0, 1));
  }

  return new Date(value);
}

function formatDateValue(
  value: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: 'UTC',
  }).format(parseDateValue(value));
}

/**
 * Format a date value to a readable string.
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  return formatDateValue(date, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date value as month and year.
 */
export function formatMonthYear(date: Date | string, locale = 'en-US'): string {
  return formatDateValue(date, locale, {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Sort posts by date (newest first)
 */
export function sortByDate<T extends { data: { pubDate: Date } }>(posts: T[]): T[] {
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
