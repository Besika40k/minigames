import { LIBRARY_CONTENT } from '../../../data/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createCategoryFilter } from './category-filter.ts';
import './library-intro.scss';
import { createSortSelect } from './sort-select.ts';

const TITLE_ID = 'library-title';

// The top of the Library page: the page title, its description, the category
// chips and the sort control
export function createLibraryIntro(): HTMLElement {
  const controls: HTMLDivElement = createElement('div', {
    className: 'library-intro__controls',
    children: [createCategoryFilter(), createSortSelect()],
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
