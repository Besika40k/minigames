import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './format-relative-time.ts';

const NOW: Date = new Date('2026-10-08T12:00:00Z');

const SECOND: number = 1000;
const MINUTE: number = 60 * SECOND;
const HOUR: number = 60 * MINUTE;
const DAY: number = 24 * HOUR;

// The text for a date that lies `elapsed` milliseconds before NOW
function formatElapsed(elapsed: number): string {
  return formatRelativeTime(new Date(NOW.getTime() - elapsed), NOW);
}

describe('formatRelativeTime', (): void => {
  it('says "just now" under a minute, for a future date and for an invalid date', (): void => {
    expect(formatElapsed(0)).toBe('just now');
    expect(formatElapsed(59 * SECOND)).toBe('just now');
    expect(formatElapsed(-HOUR)).toBe('just now');
    expect(formatRelativeTime(new Date('not a date'), NOW)).toBe('just now');
  });

  it('counts whole minutes under an hour', (): void => {
    expect(formatElapsed(MINUTE)).toBe('1 min ago');
    expect(formatElapsed(59 * MINUTE + 59 * SECOND)).toBe('59 min ago');
  });

  it('counts hours under a day, with the singular for one', (): void => {
    expect(formatElapsed(HOUR)).toBe('1 hour ago');
    expect(formatElapsed(23 * HOUR + 59 * MINUTE)).toBe('23 hours ago');
  });

  it('counts days under a week', (): void => {
    expect(formatElapsed(DAY)).toBe('1 day ago');
    expect(formatElapsed(6 * DAY)).toBe('6 days ago');
  });

  it('counts weeks up to three', (): void => {
    expect(formatElapsed(7 * DAY)).toBe('1 week ago');
    expect(formatElapsed(27 * DAY)).toBe('3 weeks ago');
  });

  it('counts months from four weeks on, never more than eleven', (): void => {
    expect(formatElapsed(28 * DAY)).toBe('1 month ago');
    expect(formatElapsed(65 * DAY)).toBe('2 months ago');
    expect(formatElapsed(364 * DAY)).toBe('11 months ago');
  });

  it('counts whole years from 365 days on', (): void => {
    expect(formatElapsed(365 * DAY)).toBe('1 year ago');
    expect(formatElapsed(800 * DAY)).toBe('2 years ago');
  });

  it('compares with the current time when no time is given', (): void => {
    const twoHoursAgo: Date = new Date(Date.now() - 2 * HOUR);

    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });
});
