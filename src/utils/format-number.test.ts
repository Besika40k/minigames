import { describe, expect, it } from 'vitest';
import { formatCompactNumber, formatNumber } from './format-number.ts';

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
