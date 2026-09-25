import type { Game } from '../../types/game.ts';
import { createGameList } from './game-list/game-list.ts';
import { createLibraryIntro } from './library-intro/library-intro.ts';
import { createPagination } from './pagination/pagination.ts';

export interface LibraryPageOptions {
  // Opens the details of a game (the Details button of its card)
  readonly onGameOpen?: (game: Game) => void;
}

export function renderLibraryPage(options: LibraryPageOptions = {}): readonly HTMLElement[] {
  return [
    createLibraryIntro(),
    createGameList({ onDetailsClick: options.onGameOpen }),
    createPagination(),
  ];
}
