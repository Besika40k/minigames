import { PAGINATION_CONTENT } from '../../../data/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import './pagination.scss';

// The mockups show at most four page buttons, and three on mobile. The styles
// hide the buttons outside the window of the current layout.
const VISIBLE_PAGES = 4;
const VISIBLE_PAGES_MOBILE = 3;

const FIRST_PAGE = 1;

export interface PaginationOptions {
  // Called with the page the visitor picked
  readonly onSelect: (page: number) => void;
}

export interface Pagination {
  readonly element: HTMLElement;
  // Builds the controls for page `page` of `totalPages`, as the API answered
  readonly render: (page: number, totalPages: number) => void;
}

// Whether a page is in the window of `size` pages around the current one. The
// window stays as centered as it can without passing the first or last page.
function isInWindow(page: number, current: number, size: number, total: number): boolean {
  const visible: number = Math.min(size, total);
  const centered: number = current - Math.floor((visible - 1) / 2);
  const start: number = Math.min(Math.max(centered, FIRST_PAGE), total - visible + 1);

  return page >= start && page < start + visible;
}

function createArrow(icon: IconName, label: string): HTMLButtonElement {
  return createElement('button', {
    className: 'pagination__arrow',
    attributes: { type: 'button', 'aria-label': label },
    children: [createIcon(icon)],
  });
}

function createPageButton(page: number): HTMLButtonElement {
  return createElement('button', {
    className: 'pagination__page',
    attributes: { type: 'button' },
    children: [
      createElement('span', {
        className: 'pagination__hidden',
        text: `${PAGINATION_CONTENT.pageLabel} `,
      }),
      String(page),
    ],
  });
}

// The page buttons and the previous and next arrows, built from each answer of
// the API: as many buttons as it has pages, and page 1 when it has none. A
// press only asks for a new address; the buttons follow the answer to it.
export function createPagination(options: PaginationOptions): Pagination {
  let current: number = FIRST_PAGE;
  let total: number = 0;
  let pageItems: HTMLLIElement[] = [];

  const previous: HTMLButtonElement = createArrow(
    IconName.ChevronLeft,
    PAGINATION_CONTENT.previousLabel,
  );
  const next: HTMLButtonElement = createArrow(IconName.ChevronRight, PAGINATION_CONTENT.nextLabel);
  // From a page past the end, the previous arrow leads back to the last page
  previous.addEventListener('click', (): void => {
    options.onSelect(Math.min(current - 1, total));
  });
  next.addEventListener('click', (): void => {
    options.onSelect(current + 1);
  });

  const nextItem: HTMLLIElement = createElement('li', {
    className: 'pagination__item',
    children: [next],
  });
  const list: HTMLUListElement = createElement('ul', {
    className: 'pagination__list',
    children: [
      createElement('li', { className: 'pagination__item', children: [previous] }),
      nextItem,
    ],
  });

  const element: HTMLElement = createElement('nav', {
    className: 'pagination',
    attributes: { 'aria-label': PAGINATION_CONTENT.label },
    children: [list],
  });
  // Nothing to show until the first answer
  element.hidden = true;

  const createPageItem = (page: number): HTMLLIElement => {
    const button: HTMLButtonElement = createPageButton(page);
    button.setAttribute('aria-current', page === current ? 'page' : 'false');
    button.addEventListener('click', (): void => {
      options.onSelect(page);
    });

    const item: HTMLLIElement = createElement('li', {
      className: 'pagination__item',
      children: [button],
    });
    const count: number = Math.max(total, FIRST_PAGE);
    item.classList.toggle(
      'pagination__item--hidden',
      !isInWindow(page, current, VISIBLE_PAGES, count),
    );
    item.classList.toggle(
      'pagination__item--hidden-mobile',
      !isInWindow(page, current, VISIBLE_PAGES_MOBILE, count),
    );

    return item;
  };

  const render = (page: number, totalPages: number): void => {
    const focused: Element | null = document.activeElement;
    const wasFocused: boolean = focused !== null && element.contains(focused);

    current = page;
    total = totalPages;
    const pages: number[] = Array.from(
      { length: Math.max(total, FIRST_PAGE) },
      (_value: unknown, index: number): number => index + FIRST_PAGE,
    );
    for (const item of pageItems) {
      item.remove();
    }
    pageItems = pages.map((pageNumber: number): HTMLLIElement => createPageItem(pageNumber));
    nextItem.before(...pageItems);

    previous.disabled = current <= FIRST_PAGE;
    next.disabled = current >= total;
    element.hidden = false;

    // A pressed page button is built anew, and an arrow at the end of the
    // list turns off; either way the focus moves to the current page, without
    // scrolling, since the list comes into view at the same time
    const isFocusLost: boolean =
      wasFocused &&
      (!(focused instanceof HTMLButtonElement) || focused.disabled || !focused.isConnected);
    if (!isFocusLost) {
      return;
    }
    const currentButton: HTMLButtonElement | null = list.querySelector('[aria-current="page"]');
    currentButton?.focus({ preventScroll: true });
  };

  return { element, render };
}
