import { createLibraryIntro } from './library-intro/library-intro.ts';

export function renderLibraryPage(): readonly HTMLElement[] {
  return [createLibraryIntro()];
}
