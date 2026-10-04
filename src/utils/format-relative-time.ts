const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DAYS_IN_WEEK = 7;
// Weeks are counted up to three; from four weeks on the months take over
const WEEKS_BEFORE_MONTHS = 4;
const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;
const MONTHS_IN_YEAR = 12;

const JUST_NOW = 'just now';

// "1 hour ago", "3 hours ago"
function formatAgo(count: number, unit: string): string {
  return `${String(count)} ${unit}${count === 1 ? '' : 's'} ago`;
}

// How long ago a date was, in the words the task asks for: "just now" under a
// minute (and for a date in the future), then "5 min ago", "2 hours ago",
// "3 days ago", "1 week ago" up to three weeks, "4 months ago" up to eleven
// months, and whole years after that. Every count is rounded down.
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const elapsed: number = now.getTime() - date.getTime();
  if (!Number.isFinite(elapsed) || elapsed < MINUTE) {
    return JUST_NOW;
  }
  if (elapsed < HOUR) {
    return `${String(Math.floor(elapsed / MINUTE))} min ago`;
  }
  if (elapsed < DAY) {
    return formatAgo(Math.floor(elapsed / HOUR), 'hour');
  }

  const days: number = Math.floor(elapsed / DAY);
  if (days < DAYS_IN_WEEK) {
    return formatAgo(days, 'day');
  }
  if (days < WEEKS_BEFORE_MONTHS * DAYS_IN_WEEK) {
    return formatAgo(Math.floor(days / DAYS_IN_WEEK), 'week');
  }
  if (days < DAYS_IN_YEAR) {
    const months: number = Math.floor(days / DAYS_IN_MONTH);
    return formatAgo(Math.min(Math.max(months, 1), MONTHS_IN_YEAR - 1), 'month');
  }

  return formatAgo(Math.floor(days / DAYS_IN_YEAR), 'year');
}
