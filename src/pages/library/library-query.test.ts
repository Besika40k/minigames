import { describe, expect, it } from 'vitest';
import { LibraryParameter, SortOrder, type Category } from '../../types/library.ts';
import {
  ALL_CATEGORIES,
  buildLibraryQuery,
  isSameQuery,
  parseLibraryQuery,
  resolveLibraryQuery,
  type ParsedLibraryQuery,
} from './library-query.ts';

const CATEGORIES: readonly Category[] = [
  { slug: 'all', label: 'All', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
];

function parse(query: string): ParsedLibraryQuery {
  return parseLibraryQuery(new URLSearchParams(query));
}

describe('parseLibraryQuery', (): void => {
  it('reads the category, sort order and page of the address', (): void => {
    expect(parse('category=puzzle&sort=name-asc&page=3')).toEqual({
      category: 'puzzle',
      sort: SortOrder.NameAscending,
      page: 3,
      invalidParameters: [],
    });
  });

  it('falls back to the defaults for missing parameters without calling them invalid', (): void => {
    expect(parse('')).toEqual({
      category: undefined,
      sort: SortOrder.RatingDescending,
      page: 1,
      invalidParameters: [],
    });
  });

  it('treats an empty category as no category', (): void => {
    expect(parse('category=').category).toBeUndefined();
  });

  it('reports an unknown sort order and uses the default one', (): void => {
    const parsed: ParsedLibraryQuery = parse('sort=newest');

    expect(parsed.sort).toBe(SortOrder.RatingDescending);
    expect(parsed.invalidParameters).toEqual([LibraryParameter.Sort]);
  });

  it('accepts only a whole page number from 1 written with digits', (): void => {
    for (const page of ['0', '-1', '2.5', '1e2', 'two', '', '99999999999999999999']) {
      expect(parse(`page=${page}`)).toMatchObject({
        page: 1,
        invalidParameters: [LibraryParameter.Page],
      });
    }
  });

  it('reports both an invalid sort order and an invalid page', (): void => {
    expect(parse('sort=x&page=x').invalidParameters).toEqual([
      LibraryParameter.Sort,
      LibraryParameter.Page,
    ]);
  });
});

describe('resolveLibraryQuery', (): void => {
  it('keeps a category the API knows', (): void => {
    expect(resolveLibraryQuery(parse('category=puzzle&page=2'), CATEGORIES)).toEqual({
      query: { category: 'puzzle', sort: SortOrder.RatingDescending, page: 2 },
      invalidParameters: [],
    });
  });

  it('gives an address without a category the default category', (): void => {
    expect(resolveLibraryQuery(parse(''), CATEGORIES).query.category).toBe('all');
  });

  it('replaces an unknown category with the default and reports it first', (): void => {
    expect(resolveLibraryQuery(parse('category=racing&sort=x'), CATEGORIES)).toEqual({
      query: { category: 'all', sort: SortOrder.RatingDescending, page: 1 },
      invalidParameters: [LibraryParameter.Category, LibraryParameter.Sort],
    });
  });

  it('takes any category as it is while the categories could not load', (): void => {
    expect(resolveLibraryQuery(parse('category=racing'), []).query.category).toBe('racing');
    expect(resolveLibraryQuery(parse(''), []).query.category).toBe(ALL_CATEGORIES);
  });
});

describe('buildLibraryQuery', (): void => {
  it('writes the three Library parameters first and keeps the other parameters', (): void => {
    const query: URLSearchParams = buildLibraryQuery(
      { category: 'puzzle', sort: SortOrder.NameDescending, page: 4 },
      new URLSearchParams('game=chess&page=1&sort=x'),
    );

    expect(query.toString()).toBe('category=puzzle&sort=name-desc&page=4&game=chess');
  });
});

describe('isSameQuery', (): void => {
  it('compares the category, the sort order and the page', (): void => {
    const query: { category: string; sort: SortOrder; page: number } = {
      category: 'puzzle',
      sort: SortOrder.NameAscending,
      page: 2,
    };

    expect(isSameQuery(query, { ...query })).toBe(true);
    expect(isSameQuery(query, { ...query, category: 'all' })).toBe(false);
    expect(isSameQuery(query, { ...query, sort: SortOrder.NameDescending })).toBe(false);
    expect(isSameQuery(query, { ...query, page: 3 })).toBe(false);
  });
});
