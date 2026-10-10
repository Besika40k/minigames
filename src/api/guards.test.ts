import { describe, expect, it } from 'vitest';
import { isArrayOf, isBoolean, isNumber, isRecord, isString } from './guards.ts';

describe('isRecord', (): void => {
  it('accepts a plain object', (): void => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ data: [] })).toBe(true);
  });

  it('rejects null, arrays and primitive values', (): void => {
    // null as the API's JSON can hold it
    const jsonNull: unknown = JSON.parse('null');

    for (const value of [jsonNull, undefined, [], 'text', 1, true]) {
      expect(isRecord(value)).toBe(false);
    }
  });
});

describe('isString', (): void => {
  it('accepts only strings, the empty one too', (): void => {
    expect(isString('')).toBe(true);
    expect(isString('chess')).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isString(undefined)).toBe(false);
  });
});

describe('isNumber', (): void => {
  it('accepts finite numbers only', (): void => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-4.5)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber('4')).toBe(false);
  });
});

describe('isBoolean', (): void => {
  it('accepts true and false, not truthy values', (): void => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean('true')).toBe(false);
  });
});

describe('isArrayOf', (): void => {
  it('accepts an array whose every item passes the item check', (): void => {
    expect(isArrayOf(['a', 'b'], isString)).toBe(true);
    expect(isArrayOf([], isString)).toBe(true);
  });

  it('rejects an array with one wrong item and a value that is not an array', (): void => {
    expect(isArrayOf(['a', 2], isString)).toBe(false);
    expect(isArrayOf({ length: 0 }, isString)).toBe(false);
  });
});
