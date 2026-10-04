import type { Game } from '../../types/game.ts';
import type { LibraryQuery } from '../../types/library.ts';
import type { AppLocation, PageView } from '../../types/route.ts';
import { createGameList, type GameList } from './game-list/game-list.ts';
import { createLibraryIntro } from './library-intro/library-intro.ts';
import { parseLibraryQuery, type ParsedLibraryQuery } from './library-query.ts';
import { createPagination } from './pagination/pagination.ts';

// The category of an address without one, until the categories come from the API
const DEFAULT_CATEGORY = 'all';

export interface LibraryPageOptions {
  // Opens the details of a game (the Details button of its card)
  readonly onGameOpen?: (game: Game) => void;
}

function readQuery(location: AppLocation): LibraryQuery {
  const parsed: ParsedLibraryQuery = parseLibraryQuery(location.query);

  return { category: parsed.category ?? DEFAULT_CATEGORY, sort: parsed.sort, page: parsed.page };
}

function isSameQuery(first: LibraryQuery, second: LibraryQuery): boolean {
  return (
    first.category === second.category && first.sort === second.sort && first.page === second.page
  );
}

// The Library shows the games of the state in the address. A new address of
// the same page (Back, Forward, a link) loads the games again, unless only
// another part of it changed.
export function renderLibraryPage(
  location: AppLocation,
  options: LibraryPageOptions = {},
): PageView {
  let query: LibraryQuery = readQuery(location);
  const list: GameList = createGameList({ onDetailsClick: options.onGameOpen });
  list.show(query);

  return {
    elements: [createLibraryIntro(), list.element, createPagination()],
    update: (next: AppLocation): void => {
      const nextQuery: LibraryQuery = readQuery(next);
      if (isSameQuery(nextQuery, query)) {
        return;
      }
      query = nextQuery;
      list.show(query);
    },
    destroy: (): void => {
      list.abort();
    },
  };
}
