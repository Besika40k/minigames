import { LIBRARY_CONTENT } from '../../../data/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import './library-intro.scss';

const TITLE_ID = 'library-title';

// The top of the Library page: the page title, its description, and the
// controls the page gives it (the category chips and the sort control)
export function createLibraryIntro(controlElements: readonly HTMLElement[]): HTMLElement {
  const controls: HTMLDivElement = createElement('div', {
    className: 'library-intro__controls',
    children: controlElements,
  });

  const inner: HTMLDivElement = createElement('div', {
    className: 'library-intro__inner',
    children: [
      createElement('h1', {
        className: 'library-intro__title',
        text: LIBRARY_CONTENT.title,
        attributes: { id: TITLE_ID },
      }),
      createElement('p', {
        className: 'library-intro__description',
        text: LIBRARY_CONTENT.description,
      }),
      controls,
    ],
  });

  return createElement('section', {
    className: 'library-intro',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
