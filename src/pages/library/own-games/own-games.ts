import { LIBRARY_CONTENT } from '../../../data/library.ts';
import { OWN_GAMES } from '../../../data/own-games.ts';
import type { Game, OwnGame } from '../../../types/game.ts';
import type { LibraryQuery } from '../../../types/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createGameCard } from '../game-list/game-card.ts';
import { ALL_CATEGORIES, FIRST_PAGE } from '../library-query.ts';
import './own-games.scss';

const TITLE_ID = 'own-games-title';

export interface OwnGamesSection {
  readonly element: HTMLElement;
  // Shows the games that belong to a state of the Library, or hides the
  // section when none do
  readonly show: (query: LibraryQuery) => void;
}

// The games of MiniGames itself in the chosen category. They stand above the
// first page only: the API knows nothing of them, so they are pinned there
// instead of being sorted into its pages.
function getPinnedGames(query: LibraryQuery): readonly OwnGame[] {
  return query.page === FIRST_PAGE
    ? OWN_GAMES.filter(
        (game: OwnGame): boolean =>
          query.category === ALL_CATEGORIES || game.category === query.category,
      )
    : [];
}

// "MiniGames Originals": the cards of the games made for MiniGames, above the
// Library's list. Each list item is a container, so a card lays itself out by
// its own width (see game-card.scss).
export function createOwnGamesSection(onDetailsClick?: (game: Game) => void): OwnGamesSection {
  const items: HTMLUListElement = createElement('ul', { className: 'own-games__items' });

  const panel: HTMLDivElement = createElement('div', {
    className: 'own-games__panel',
    children: [
      createElement('h2', {
        className: 'own-games__title',
        text: LIBRARY_CONTENT.ownGamesTitle,
        attributes: { id: TITLE_ID },
      }),
      createElement('p', {
        className: 'own-games__description',
        text: LIBRARY_CONTENT.ownGamesDescription,
      }),
      items,
    ],
  });

  const element: HTMLElement = createElement('section', {
    className: 'own-games',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [createElement('div', { className: 'own-games__inner', children: [panel] })],
  });
  // The games whose cards are in the section
  let shownGames: readonly OwnGame[] = [];
  element.hidden = true;

  const show = (query: LibraryQuery): void => {
    const games: readonly OwnGame[] = getPinnedGames(query);
    element.hidden = games.length === 0;
    // The same games keep their cards, so the pictures are not drawn again
    const isSame: boolean =
      games.length === shownGames.length &&
      games.every((game: OwnGame, index: number): boolean => game === shownGames[index]);
    if (isSame) {
      return;
    }
    shownGames = games;
    items.replaceChildren(
      ...games.map((game: OwnGame): HTMLLIElement =>
        createElement('li', {
          className: 'own-games__item',
          children: [createGameCard(game, onDetailsClick)],
        }),
      ),
    );
  };

  return { element, show };
}
