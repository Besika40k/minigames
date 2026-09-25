import { LIBRARY_PAGE_COUNT, PAGINATION_CONTENT } from '../../../data/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import './pagination.scss';

// The mockups show at most four page buttons. The styles hide the buttons
// outside the window.
const VISIBLE_PAGES = 4;

// Whether a page is in the window of `size` pages around the current one. The
// window stays as centered as it can without passing the first or last page.
function isInWindow(page: number, current: number, size: number): boolean {
  const visible: number = Math.min(size, LIBRARY_PAGE_COUNT);
  const centered: number = current - Math.floor((visible - 1) / 2);
  const start: number = Math.min(Math.max(centered, 1), LIBRARY_PAGE_COUNT - visible + 1);

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

// The page buttons and the previous and next arrows. Only the pagination
// changes for now: the list of cards stays the same on every page.
export function createPagination(): HTMLElement {
  let current = 1;

  const previous: HTMLButtonElement = createArrow(
    IconName.ChevronLeft,
    PAGINATION_CONTENT.previousLabel,
  );
  const next: HTMLButtonElement = createArrow(IconName.ChevronRight, PAGINATION_CONTENT.nextLabel);

  const pages: number[] = Array.from(
    { length: LIBRARY_PAGE_COUNT },
    (_value: unknown, index: number): number => index + 1,
  );
  const buttons: HTMLButtonElement[] = pages.map((page: number): HTMLButtonElement =>
    createPageButton(page),
  );
  const pageItems: HTMLLIElement[] = buttons.map((button: HTMLButtonElement): HTMLLIElement =>
    createElement('li', { className: 'pagination__item', children: [button] }),
  );

  const update = (): void => {
    for (const [index, button] of buttons.entries()) {
      const page: number = index + 1;
      button.setAttribute('aria-current', page === current ? 'page' : 'false');
      button.parentElement?.classList.toggle(
        'pagination__item--hidden',
        !isInWindow(page, current, VISIBLE_PAGES),
      );
    }
    previous.disabled = current === 1;
    next.disabled = current === LIBRARY_PAGE_COUNT;
  };

  // An arrow that gets disabled loses the focus, so the focus moves to the
  // button of the page it led to
  const goTo = (page: number): void => {
    const focused: Element | null = document.activeElement;
    current = page;
    update();
    if (focused instanceof HTMLButtonElement && focused.disabled) {
      buttons[current - 1]?.focus();
    }
  };

  for (const [index, button] of buttons.entries()) {
    button.addEventListener('click', (): void => {
      goTo(index + 1);
    });
  }
  previous.addEventListener('click', (): void => {
    goTo(current - 1);
  });
  next.addEventListener('click', (): void => {
    goTo(current + 1);
  });

  update();

  const list: HTMLUListElement = createElement('ul', {
    className: 'pagination__list',
    children: [
      createElement('li', { className: 'pagination__item', children: [previous] }),
      ...pageItems,
      createElement('li', { className: 'pagination__item', children: [next] }),
    ],
  });

  return createElement('nav', {
    className: 'pagination',
    attributes: { 'aria-label': PAGINATION_CONTENT.label },
    children: [list],
  });
}
