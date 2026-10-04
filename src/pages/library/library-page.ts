import { showSnackbar } from '../../components/snackbar/snackbar.ts';
import { LIBRARY_CONTENT } from '../../data/library.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { Game, GamesPage } from '../../types/game.ts';
import type { Category, LibraryParameter, LibraryQuery, SortOrder } from '../../types/library.ts';
import type { AppLocation, PageView } from '../../types/route.ts';
import { createGameList, type GameList } from './game-list/game-list.ts';
import { createCategoryFilter, type CategoryFilter } from './library-intro/category-filter.ts';
import { createLibraryIntro } from './library-intro/library-intro.ts';
import { createSortSelect, type SortSelect } from './library-intro/sort-select.ts';
import {
  ALL_CATEGORIES,
  buildLibraryQuery,
  FIRST_PAGE,
  isSameQuery,
  parseLibraryQuery,
  resolveLibraryQuery,
  type ParsedLibraryQuery,
  type ResolvedLibraryQuery,
} from './library-query.ts';
import { createPagination, type Pagination } from './pagination/pagination.ts';

export interface LibraryPageOptions {
  // Opens the details of a game (the Details button of its card)
  readonly onGameOpen?: (game: Game) => void;
  // Puts a new query of the Library into the address: a new history entry, or
  // the current one replaced for a correction
  readonly onNavigate: (query: URLSearchParams, isReplace: boolean) => void;
}

// The Library shows what its address asks for. The chips and the sort control
// never change by themselves: a press asks for a new address, and the page
// follows the address. A click, a deep link and Back/Forward all take this one
// way, and every change of the list is a new request to the API.
export function renderLibraryPage(location: AppLocation, options: LibraryPageOptions): PageView {
  let address: URLSearchParams = location.query;
  // The API's categories; an empty list when they could not load
  let categories: readonly Category[] | undefined;
  // The state whose games are on the screen or on their way
  let shown: LibraryQuery | undefined;
  // The number of pages of the last answer
  let totalPages: number | undefined;

  // The state on the screen, or the address's own while the categories load
  const getCurrentQuery = (): LibraryQuery => {
    const parsed: ParsedLibraryQuery = parseLibraryQuery(address);

    return (
      shown ?? { category: parsed.category ?? ALL_CATEGORIES, sort: parsed.sort, page: parsed.page }
    );
  };

  const goTo = (query: LibraryQuery): void => {
    if (shown !== undefined && isSameQuery(query, shown)) {
      return;
    }
    options.onNavigate(buildLibraryQuery(query, address), false);
  };

  // Values the Library cannot use give way to their defaults in the address
  // itself, with a warning. The new address waits until the current one is
  // drawn, so the router is not asked for a new address in the middle of one.
  const correct = (query: LibraryQuery, invalidParameters: readonly LibraryParameter[]): void => {
    for (const parameter of invalidParameters) {
      showSnackbar({
        variant: SnackbarVariant.Warning,
        text: LIBRARY_CONTENT.invalidParameterMessages[parameter],
      });
    }
    const corrected: URLSearchParams = buildLibraryQuery(query, address);
    queueMicrotask((): void => {
      options.onNavigate(corrected, true);
    });
  };

  // After a page change the new cards start at the top of the list, so the list
  // comes into view when the visitor has scrolled past its top
  const revealList = (): void => {
    if (list.element.getBoundingClientRect().top >= 0) {
      return;
    }
    const isReduced: boolean = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.element.scrollIntoView({ block: 'start', behavior: isReduced ? 'instant' : 'smooth' });
  };

  const list: GameList = createGameList({
    onDetailsClick: options.onGameOpen,
    onLoad: (result: GamesPage): void => {
      totalPages = result.totalPages;
      pagination.render(result.page, result.totalPages);
    },
    onFirstPage: (): void => {
      goTo({ ...getCurrentQuery(), page: FIRST_PAGE });
    },
  });
  const pagination: Pagination = createPagination({
    onSelect: (page: number): void => {
      goTo({ ...getCurrentQuery(), page });
      revealList();
    },
  });

  // A change of category or sort starts again from the first page
  const filter: CategoryFilter = createCategoryFilter({
    onSelect: (slug: string): void => {
      goTo({ ...getCurrentQuery(), category: slug, page: FIRST_PAGE });
    },
    onLoad: (loaded: readonly Category[]): void => {
      categories = loaded;
      sync();
    },
    onError: (): void => {
      categories ??= [];
      sync();
    },
  });
  const sortSelect: SortSelect = createSortSelect({
    onSelect: (order: SortOrder): void => {
      goTo({ ...getCurrentQuery(), sort: order, page: FIRST_PAGE });
    },
  });

  // Brings the controls and the list in line with the address. The games wait
  // for the categories, which name the default and tell a wrong category.
  function sync(): void {
    const parsed: ParsedLibraryQuery = parseLibraryQuery(address);
    sortSelect.setSelected(parsed.sort);
    if (categories === undefined) {
      return;
    }

    const resolved: ResolvedLibraryQuery = resolveLibraryQuery(parsed, categories);
    filter.setSelected(resolved.query.category);
    if (resolved.invalidParameters.length > 0) {
      correct(resolved.query, resolved.invalidParameters);
      return;
    }
    if (shown !== undefined && isSameQuery(resolved.query, shown)) {
      return;
    }
    // Another page of the same list is marked at once; any other change
    // waits for its answer to know how many pages there are
    const isSameList: boolean =
      shown?.category === resolved.query.category && shown.sort === resolved.query.sort;
    if (isSameList && totalPages !== undefined) {
      pagination.render(resolved.query.page, totalPages);
    }
    shown = resolved.query;
    list.show(shown);
  }

  sync();

  return {
    elements: [
      createLibraryIntro([filter.element, sortSelect.element]),
      list.element,
      pagination.element,
    ],
    update: (next: AppLocation): void => {
      address = next.query;
      sync();
    },
    destroy: (): void => {
      filter.abort();
      list.abort();
    },
  };
}
