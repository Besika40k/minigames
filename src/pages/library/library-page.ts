import { createGameList } from './game-list/game-list.ts';
import { createLibraryIntro } from './library-intro/library-intro.ts';
import { createPagination } from './pagination/pagination.ts';

export function renderLibraryPage(): readonly HTMLElement[] {
  return [createLibraryIntro(), createGameList(), createPagination()];
}
