import { createGameList } from './game-list/game-list.ts';
import { createLibraryIntro } from './library-intro/library-intro.ts';

export function renderLibraryPage(): readonly HTMLElement[] {
  return [createLibraryIntro(), createGameList()];
}
