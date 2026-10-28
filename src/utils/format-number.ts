import { UNRATED_TEXT } from '../data/games.ts';

const LOCALE = 'en-US';

// Ratings have one decimal, as the API gives them
const RATING_FRACTION_DIGITS = 1;

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

// 4.8 -> "4.8", 5 -> "5.0". A rating of 0 means nobody has rated the game yet,
// so it shows "New" instead of a score.
export function formatRating(rating: number): string {
  return rating === 0 ? UNRATED_TEXT : rating.toFixed(RATING_FRACTION_DIGITS);
}
