import { fetchGames } from '../../../api/games-api.ts';
import { LIBRARY_CONTENT } from '../../../data/library.ts';
import type { Game, GamesPage } from '../../../types/game.ts';
import type { LibraryQuery } from '../../../types/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createGameCard } from './game-card.ts';
import './game-list.scss';

const TITLE_ID = 'game-list-title';

export interface GameListOptions {
  // Called with the game whose Details button was pressed
  readonly onDetailsClick?: (game: Game) => void;
}

export interface GameList {
  readonly element: HTMLElement;
  // Loads and shows the games of a state of the Library
  readonly show: (query: LibraryQuery) => void;
  // Cancels the request when the page closes
  readonly abort: () => void;
}

// The cards of the Library, one page of the API's answer at a time. Each list
// item is a container, so a card can lay itself out by its own width.
export function createGameList(options: GameListOptions = {}): GameList {
  let controller: AbortController | undefined;

  const items: HTMLUListElement = createElement('ul', { className: 'game-list__items' });

  const load = async (query: LibraryQuery): Promise<void> => {
    controller?.abort();
    const current: AbortController = new AbortController();
    controller = current;
    try {
      const page: GamesPage = await fetchGames(query, current.signal);
      const cards: HTMLLIElement[] = page.games.map((game: Game): HTMLLIElement =>
        createElement('li', {
          className: 'game-list__item',
          children: [createGameCard(game, options.onDetailsClick)],
        }),
      );
      items.replaceChildren(...cards);
    } catch {
      // The loading, error and empty states come next. Until then a failed
      // request leaves the list empty.
      if (!current.signal.aborted) {
        items.replaceChildren();
      }
    }
  };

  const inner: HTMLDivElement = createElement('div', {
    className: 'game-list__inner',
    children: [
      createElement('h2', {
        className: 'game-list__title',
        text: LIBRARY_CONTENT.gamesTitle,
        attributes: { id: TITLE_ID },
      }),
      items,
    ],
  });

  const element: HTMLElement = createElement('section', {
    className: 'game-list',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });

  return {
    element,
    show: (query: LibraryQuery): void => {
      void load(query);
    },
    abort: (): void => {
      controller?.abort();
    },
  };
}
