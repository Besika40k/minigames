import { LIBRARY_GAMES } from '../../../data/games.ts';
import { LIBRARY_CONTENT } from '../../../data/library.ts';
import type { Game } from '../../../types/game.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createGameCard } from './game-card.ts';
import './game-list.scss';

const TITLE_ID = 'game-list-title';

export interface GameListOptions {
  // Called with the game whose Details button was pressed
  readonly onDetailsClick?: (game: Game) => void;
}

// The cards of the Library. Each list item is a container, so a card can lay
// itself out by its own width.
export function createGameList(options: GameListOptions = {}): HTMLElement {
  const items: HTMLLIElement[] = LIBRARY_GAMES.map((game: Game): HTMLLIElement =>
    createElement('li', {
      className: 'game-list__item',
      children: [createGameCard(game, options.onDetailsClick)],
    }),
  );

  const inner: HTMLDivElement = createElement('div', {
    className: 'game-list__inner',
    children: [
      createElement('h2', {
        className: 'game-list__title',
        text: LIBRARY_CONTENT.gamesTitle,
        attributes: { id: TITLE_ID },
      }),
      createElement('ul', { className: 'game-list__items', children: items }),
    ],
  });

  return createElement('section', {
    className: 'game-list',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
