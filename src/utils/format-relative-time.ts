const LOCALE = 'en-US';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// The units from the largest down, each with its length in milliseconds
const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * DAY],
  ['month', 30 * DAY],
  ['week', 7 * DAY],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

// "2 days ago", "1 week ago": the mockups always use numbers, never "yesterday"
const formatter: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: 'always',
});

// How long ago a date was, in the largest unit that fits
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const difference: number = date.getTime() - now.getTime();

  for (const [unit, length] of UNITS) {
    if (Math.abs(difference) >= length) {
      return formatter.format(Math.trunc(difference / length), unit);
    }
  }

  return formatter.format(0, 'minute');
}
