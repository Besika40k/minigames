const LOCALE = 'en-US';

const fullFormat: Intl.NumberFormat = new Intl.NumberFormat(LOCALE);

// The mockup cuts the number instead of rounding it: 94,250 is "94.2K"
const compactFormat: Intl.NumberFormat = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
  roundingMode: 'trunc',
});

// 94250 -> "94,250"
export function formatNumber(value: number): string {
  return fullFormat.format(value);
}

// 94250 -> "94.2K"
export function formatCompactNumber(value: number): string {
  return compactFormat.format(value);
}
