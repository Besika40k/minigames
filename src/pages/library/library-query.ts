import { DEFAULT_SORT_ORDER } from '../../data/library.ts';
import {
  LibraryParameter,
  SortOrder,
  type Category,
  type LibraryQuery,
} from '../../types/library.ts';

// Pure helpers between the address and the Library's state. They read nothing
// from the page, so they are easy to test.

export const FIRST_PAGE = 1;

// The API's own value for "no filter". It stands in for the default category
// only while the categories cannot be loaded.
export const ALL_CATEGORIES = 'all';

const SORT_ORDERS: ReadonlySet<string> = new Set<string>(Object.values(SortOrder));

const LIBRARY_PARAMETERS: ReadonlySet<string> = new Set<string>(Object.values(LibraryParameter));

// The Library's state as the address gives it
export interface ParsedLibraryQuery {
  // Undefined when the address names no category
  readonly category: string | undefined;
  readonly sort: SortOrder;
  readonly page: number;
  // The parameters with a value the Library cannot use, which fell back to
  // their defaults
  readonly invalidParameters: readonly LibraryParameter[];
}

// The state to show, once the categories are known
export interface ResolvedLibraryQuery {
  readonly query: LibraryQuery;
  readonly invalidParameters: readonly LibraryParameter[];
}

function isSortOrder(value: string): value is SortOrder {
  return SORT_ORDERS.has(value);
}

// A page is a whole number from 1, written with digits only
function parsePage(value: string): number | undefined {
  const page: number = /^\d+$/.test(value) ? Number(value) : NaN;

  return Number.isSafeInteger(page) && page >= FIRST_PAGE ? page : undefined;
}

export function parseLibraryQuery(parameters: URLSearchParams): ParsedLibraryQuery {
  const category: string = parameters.get(LibraryParameter.Category) ?? '';
  const sort: string | null = parameters.get(LibraryParameter.Sort);
  const pageText: string | null = parameters.get(LibraryParameter.Page);
  const page: number | undefined = pageText === null ? FIRST_PAGE : parsePage(pageText);

  const validSort: SortOrder | undefined = sort !== null && isSortOrder(sort) ? sort : undefined;
  const isSortInvalid: boolean = sort !== null && validSort === undefined;

  return {
    category: category === '' ? undefined : category,
    sort: validSort ?? DEFAULT_SORT_ORDER,
    page: page ?? FIRST_PAGE,
    invalidParameters: [
      ...(isSortInvalid ? [LibraryParameter.Sort] : []),
      ...(page === undefined ? [LibraryParameter.Page] : []),
    ],
  };
}

// Checks the category of the address against the API's categories: an
// address without one gets the default, and an unknown one is invalid.
// Categories that could not load are an empty list: then any category is taken
// as it is, and the default is "all".
export function resolveLibraryQuery(
  parsed: ParsedLibraryQuery,
  categories: readonly Category[],
): ResolvedLibraryQuery {
  const fallback: string =
    categories.find((category: Category): boolean => category.isDefault)?.slug ?? ALL_CATEGORIES;
  const isKnown: boolean =
    categories.length === 0 ||
    categories.some((category: Category): boolean => category.slug === parsed.category);
  const isCategoryInvalid: boolean = parsed.category !== undefined && !isKnown;
  const category: string = isKnown && parsed.category !== undefined ? parsed.category : fallback;

  return {
    query: { category, sort: parsed.sort, page: parsed.page },
    invalidParameters: [
      ...(isCategoryInvalid ? [LibraryParameter.Category] : []),
      ...parsed.invalidParameters,
    ],
  };
}

// The address query of a state of the Library: its three parameters first,
// then whatever else the address holds, such as an open dialog
export function buildLibraryQuery(query: LibraryQuery, current: URLSearchParams): URLSearchParams {
  const parameters: URLSearchParams = new URLSearchParams([
    [LibraryParameter.Category, query.category],
    [LibraryParameter.Sort, query.sort],
    [LibraryParameter.Page, String(query.page)],
  ]);
  for (const [name, value] of current) {
    if (!LIBRARY_PARAMETERS.has(name)) {
      parameters.append(name, value);
    }
  }

  return parameters;
}

export function isSameQuery(first: LibraryQuery, second: LibraryQuery): boolean {
  return (
    first.category === second.category && first.sort === second.sort && first.page === second.page
  );
}
