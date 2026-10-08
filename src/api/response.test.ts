import { describe, expect, it } from 'vitest';
import { ApiError, ApiErrorKind } from './api-error.ts';
import { isString } from './guards.ts';
import { readData, readList } from './response.ts';

function toName(value: unknown): string {
  if (!isString(value)) {
    throw new TypeError('not a name');
  }

  return value.toUpperCase();
}

describe('readData', (): void => {
  it('returns the data of an answer', (): void => {
    expect(readData({ data: { slug: 'chess' } })).toEqual({ slug: 'chess' });
  });

  it('fails as an invalid response when the answer is not an object', (): void => {
    expect((): unknown => readData([])).toThrow(ApiError);
    expect((): unknown => readData('text')).toThrow(
      expect.objectContaining({ kind: ApiErrorKind.InvalidResponse }),
    );
  });
});

describe('readList', (): void => {
  it('converts every item of a collection', (): void => {
    expect(readList({ data: ['a', 'b'], meta: {} }, toName)).toEqual(['A', 'B']);
  });

  it('fails as an invalid response when the data is not a list', (): void => {
    expect((): unknown => readList({ data: { slug: 'chess' } }, toName)).toThrow(
      expect.objectContaining({ kind: ApiErrorKind.InvalidResponse }),
    );
  });

  it('passes on the failure of an item check', (): void => {
    expect((): unknown => readList({ data: ['a', 2] }, toName)).toThrow('not a name');
  });
});
