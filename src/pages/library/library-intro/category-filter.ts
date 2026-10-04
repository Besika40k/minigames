import { fetchCategories } from '../../../api/categories-api.ts';
import { createAsyncArea, type AsyncArea } from '../../../components/feedback/async-area.ts';
import { createSkeleton } from '../../../components/skeleton/skeleton.ts';
import { LIBRARY_CONTENT } from '../../../data/library.ts';
import type { Category } from '../../../types/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import './category-filter.scss';

// A mouse press that moves farther than this drags the row instead of pressing
// the chip under the pointer
const DRAG_THRESHOLD = 5;

// The API has seven categories, and the skeleton holds their place
const SKELETON_CHIPS = 7;

export interface CategoryFilterOptions {
  // Called with the slug of the chip the visitor pressed
  readonly onSelect: (slug: string) => void;
  // Called with the categories once they are on the screen
  readonly onLoad: (categories: readonly Category[]) => void;
  readonly onError: () => void;
}

export interface CategoryFilter {
  readonly element: HTMLElement;
  // Marks the chip of the category the address names
  readonly setSelected: (slug: string | undefined) => void;
  // Cancels the request when the page closes
  readonly abort: () => void;
}

// Touch screens swipe the row by themselves. This lets a mouse drag it too, and
// a drag that moved the row does not also press the chip it started on.
function enableMouseDrag(row: HTMLElement): void {
  let startX = 0;
  let startScroll = 0;
  let isPressed = false;
  let isDragging = false;

  row.addEventListener('pointerdown', (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }
    isPressed = true;
    isDragging = false;
    startX = event.clientX;
    startScroll = row.scrollLeft;
  });

  row.addEventListener('pointermove', (event: PointerEvent): void => {
    if (!isPressed) {
      return;
    }
    const distance: number = event.clientX - startX;
    if (!isDragging && Math.abs(distance) > DRAG_THRESHOLD) {
      isDragging = true;
      row.setPointerCapture(event.pointerId);
      row.classList.add('category-filter--dragging');
    }
    if (isDragging) {
      row.scrollLeft = startScroll - distance;
    }
  });

  // The browser sends the click right after the release, in the same task, so
  // the drag ends one task later: after that click, before any other
  const release = (): void => {
    isPressed = false;
    row.classList.remove('category-filter--dragging');
    setTimeout((): void => {
      isDragging = false;
    });
  };
  row.addEventListener('pointerup', release);
  row.addEventListener('pointercancel', release);

  // The click that ends a drag is stopped before it reaches a chip
  row.addEventListener(
    'click',
    (event: MouseEvent): void => {
      if (isDragging) {
        event.stopPropagation();
      }
    },
    { capture: true },
  );
}

// Slides a chip that the row clips fully into view. Only the row scrolls, so
// the page stays where it is.
function revealChip(row: HTMLElement, chip: HTMLElement): void {
  const rowBox: DOMRect = row.getBoundingClientRect();
  const chipBox: DOMRect = chip.getBoundingClientRect();
  if (chipBox.left < rowBox.left) {
    row.scrollBy({ left: chipBox.left - rowBox.left, behavior: 'smooth' });
  } else if (chipBox.right > rowBox.right) {
    row.scrollBy({ left: chipBox.right - rowBox.right, behavior: 'smooth' });
  }
}

function createRow(items: readonly HTMLLIElement[]): HTMLUListElement {
  return createElement('ul', {
    className: 'category-filter',
    attributes: { 'aria-label': LIBRARY_CONTENT.categoriesLabel },
    children: items,
  });
}

function createSkeletonRow(): HTMLUListElement {
  const items: HTMLLIElement[] = Array.from({ length: SKELETON_CHIPS }, (): HTMLLIElement =>
    createElement('li', {
      className: 'category-filter__item',
      children: [createSkeleton('category-filter__skeleton')],
    }),
  );
  const row: HTMLUListElement = createRow(items);
  row.setAttribute('aria-hidden', 'true');

  return row;
}

// The category chips, loaded from the API. One chip is pressed at a time: the
// one of the category in the address, so a press only asks for a new address.
// The row never wraps; what does not fit is clipped and can be swiped or
// dragged into view.
export function createCategoryFilter(options: CategoryFilterOptions): CategoryFilter {
  let chips: ReadonlyMap<string, HTMLButtonElement> = new Map();
  let selected: string | undefined;
  let row: HTMLUListElement | undefined;

  const markSelected = (): void => {
    for (const [slug, chip] of chips) {
      chip.setAttribute('aria-pressed', String(slug === selected));
    }
    const chip: HTMLButtonElement | undefined =
      selected === undefined ? undefined : chips.get(selected);
    if (row !== undefined && chip !== undefined) {
      revealChip(row, chip);
    }
  };

  const showChips = (categories: readonly Category[]): readonly Node[] => {
    const entries: [string, HTMLButtonElement][] = categories.map(
      (category: Category): [string, HTMLButtonElement] => {
        const chip: HTMLButtonElement = createElement('button', {
          className: 'category-filter__chip',
          text: category.label,
          attributes: { type: 'button', 'aria-pressed': 'false' },
        });
        chip.addEventListener('click', (): void => {
          options.onSelect(category.slug);
        });

        return [category.slug, chip];
      },
    );
    chips = new Map(entries);

    const items: HTMLLIElement[] = entries.map(
      ([, chip]: [string, HTMLButtonElement]): HTMLLIElement =>
        createElement('li', { className: 'category-filter__item', children: [chip] }),
    );
    row = createRow(items);
    enableMouseDrag(row);

    return [row];
  };

  // The chips, or the skeleton, the error banner or a note in their place.
  // It takes no box of its own, so the chips stay in the row of the controls.
  const element: HTMLDivElement = createElement('div', { className: 'category-filter__area' });

  const area: AsyncArea = createAsyncArea({
    container: element,
    messages: LIBRARY_CONTENT.categoriesMessages,
    load: fetchCategories,
    renderSkeleton: (): readonly Node[] => [createSkeletonRow()],
    renderData: showChips,
    isEmpty: (categories: readonly Category[]): boolean => categories.length === 0,
    renderEmpty: (): readonly Node[] => [
      createElement('p', {
        className: 'category-filter__note',
        text: LIBRARY_CONTENT.noCategoriesText,
      }),
    ],
    onLoad: (categories: readonly Category[]): void => {
      markSelected();
      options.onLoad(categories);
    },
    onError: options.onError,
  });
  area.reload();

  return {
    element,
    setSelected: (slug: string | undefined): void => {
      selected = slug;
      markSelected();
    },
    abort: (): void => {
      area.abort();
    },
  };
}
