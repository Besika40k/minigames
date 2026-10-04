import { DEFAULT_SORT_ORDER } from '../../data/library.ts';
import { LibraryParameter, SortOrder } from '../../types/library.ts';

// Pure helpers between the address and the Library's state. They read nothing
// from the page, so they are easy to test.

export const FIRST_PAGE = 1;

const SORT_ORDERS: ReadonlySet<string> = new Set<string>(Object.values(SortOrder));

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
