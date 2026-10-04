import { fetchGames } from '../../../api/games-api.ts';
import { getRouteHref } from '../../../app/router.ts';
import { createButtonLink } from '../../../components/button/button.ts';
import { createAsyncArea, type AsyncArea } from '../../../components/feedback/async-area.ts';
import { createEmptyState } from '../../../components/feedback/empty-state.ts';
import { createSkeleton } from '../../../components/skeleton/skeleton.ts';
import { LIBRARY_CONTENT } from '../../../data/library.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import type { Game, GamesPage } from '../../../types/game.ts';
import type { LibraryQuery } from '../../../types/library.ts';
import { Route } from '../../../types/route.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createGameCard } from './game-card.ts';
import './game-list.scss';

const TITLE_ID = 'game-list-title';

// A page has six games, and the skeleton holds their place
const SKELETON_CARDS = 6;

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

// A grey card in the shape of a real one: the photo box and a few bars
function createSkeletonCard(): HTMLLIElement {
  const body: HTMLDivElement = createElement('div', {
    className: 'game-card__skeleton-body',
    children: [
      createSkeleton('game-card__skeleton-line game-card__skeleton-line--title'),
      createSkeleton('game-card__skeleton-line'),
      createSkeleton('game-card__skeleton-line game-card__skeleton-line--short'),
      createSkeleton('game-card__skeleton-line game-card__skeleton-line--button'),
    ],
  });
  const card: HTMLDivElement = createElement('div', {
    className: 'game-card game-card--skeleton',
    children: [createSkeleton('game-card__skeleton-image'), body],
  });

  return createElement('li', { className: 'game-list__item', children: [card] });
}

function createItems(items: readonly HTMLLIElement[], isSkeleton: boolean): HTMLUListElement {
  return createElement('ul', {
    className: 'game-list__items',
    attributes: isSkeleton ? { 'aria-hidden': 'true' } : {},
    children: items,
  });
}

function createSkeletonItems(): readonly Node[] {
  const items: HTMLLIElement[] = Array.from({ length: SKELETON_CARDS }, (): HTMLLIElement =>
    createSkeletonCard(),
  );

  return [createItems(items, true)];
}

function createNotFound(): HTMLElement {
  return createEmptyState({
    title: LIBRARY_CONTENT.notFoundTitle,
    message: LIBRARY_CONTENT.notFoundMessage,
    action: createButtonLink({
      variant: ButtonVariant.Outlined,
      size: ButtonSize.Medium,
      text: LIBRARY_CONTENT.showAllText,
      href: getRouteHref(Route.Library),
    }),
  });
}

// The cards of the Library, one page of the API's answer at a time. Each list
// item is a container, so a card can lay itself out by its own width.
export function createGameList(options: GameListOptions = {}): GameList {
  // The state whose games are on the screen, set by `show`
  let query: LibraryQuery;

  const content: HTMLDivElement = createElement('div', { className: 'game-list__content' });

  const area: AsyncArea = createAsyncArea({
    container: content,
    messages: LIBRARY_CONTENT.gamesMessages,
    load: (signal: AbortSignal): Promise<GamesPage> => fetchGames(query, signal),
    renderSkeleton: createSkeletonItems,
    renderData: (page: GamesPage): readonly Node[] => {
      const items: HTMLLIElement[] = page.games.map((game: Game): HTMLLIElement =>
        createElement('li', {
          className: 'game-list__item',
          children: [createGameCard(game, options.onDetailsClick)],
        }),
      );

      return [createItems(items, false)];
    },
    isEmpty: (page: GamesPage): boolean => page.games.length === 0,
    renderEmpty: (): readonly Node[] => [createNotFound()],
  });

  // Until the page knows which games to ask for, the list shows its skeleton
  content.setAttribute('aria-busy', 'true');
  content.replaceChildren(...createSkeletonItems());

  const inner: HTMLDivElement = createElement('div', {
    className: 'game-list__inner',
    children: [
      createElement('h2', {
        className: 'game-list__title',
        text: LIBRARY_CONTENT.gamesTitle,
        attributes: { id: TITLE_ID },
      }),
      content,
    ],
  });

  const element: HTMLElement = createElement('section', {
    className: 'game-list',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });

  return {
    element,
    show: (next: LibraryQuery): void => {
      query = next;
      area.reload();
    },
    abort: (): void => {
      area.abort();
    },
  };
}
