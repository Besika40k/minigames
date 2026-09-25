import { createElement } from '../../utils/create-element.ts';

const TITLE_ID = 'library-title';

export function renderLibraryPage(): readonly HTMLElement[] {
  return [
    createElement('section', {
      className: 'library',
      attributes: { 'aria-labelledby': TITLE_ID },
      children: [createElement('h1', { text: 'Game Library', attributes: { id: TITLE_ID } })],
    }),
  ];
}
