import { describe, expect, it } from 'vitest';
import { UNRATED_TEXT } from '../data/games.ts';
import { formatCompactNumber, formatNumber, formatRating } from './format-number.ts';

describe('formatNumber', (): void => {
  it('groups the thousands with commas', (): void => {
    expect(formatNumber(94_250)).toBe('94,250');
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });

  it('leaves a small number as it is', (): void => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });
});

describe('formatCompactNumber', (): void => {
  it('shortens thousands and millions with one decimal', (): void => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(2_300_000)).toBe('2.3M');
  });

  it('cuts the decimal instead of rounding it up, as the mockup does', (): void => {
    expect(formatCompactNumber(94_250)).toBe('94.2K');
    expect(formatCompactNumber(1999)).toBe('1.9K');
  });

  it('drops a zero decimal and keeps numbers under a thousand whole', (): void => {
    expect(formatCompactNumber(2000)).toBe('2K');
    expect(formatCompactNumber(870)).toBe('870');
  });
});

describe('formatRating', (): void => {
  it('shows a rating with one decimal', (): void => {
    expect(formatRating(4.8)).toBe('4.8');
    expect(formatRating(5)).toBe('5.0');
  });

  it('marks a game nobody has rated yet as new', (): void => {
    expect(formatRating(0)).toBe(UNRATED_TEXT);
  });
});
