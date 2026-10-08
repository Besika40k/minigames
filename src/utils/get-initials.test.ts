import { describe, expect, it } from 'vitest';
import { getInitials } from './get-initials.ts';

describe('getInitials', (): void => {
  it('takes the first two capitals of a camel case or underscored name', (): void => {
    expect(getInitials('Alex_Pro99')).toBe('AP');
    expect(getInitials('CozyGamer_x')).toBe('CG');
    expect(getInitials('MaxiMumPower')).toBe('MM');
  });

  it('uses the first letters and digits when the name has fewer than two capitals', (): void => {
    expect(getInitials('Gamer')).toBe('GA');
    expect(getInitials('_x9_')).toBe('X9');
  });

  it('reads capitals beyond the Latin alphabet', (): void => {
    expect(getInitials('ÉlodieÖzil')).toBe('ÉÖ');
    expect(getInitials('шахматист')).toBe('ША');
  });

  it('gives a one-letter name a single initial and an empty name none', (): void => {
    expect(getInitials('a')).toBe('A');
    expect(getInitials('__')).toBe('');
  });
});
