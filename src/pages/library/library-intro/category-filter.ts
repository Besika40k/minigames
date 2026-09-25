import { CATEGORIES, LIBRARY_CONTENT } from '../../../data/library.ts';
import type { Category } from '../../../types/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import './category-filter.scss';

// A mouse press that moves farther than this drags the row instead of pressing
// the chip under the pointer
const DRAG_THRESHOLD = 5;

// Marks one chip as pressed and the others as not. The picked chip slides fully
// into view when the row clips it.
function selectChip(chips: readonly HTMLButtonElement[], selected: HTMLButtonElement): void {
  for (const chip of chips) {
    chip.setAttribute('aria-pressed', String(chip === selected));
  }
  selected.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
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

// The category chips. One is pressed at a time; the row never wraps, and what
// does not fit is clipped and can be swiped or dragged into view.
export function createCategoryFilter(): HTMLUListElement {
  const chips: HTMLButtonElement[] = CATEGORIES.map((category: Category): HTMLButtonElement =>
    createElement('button', {
      className: 'category-filter__chip',
      text: category.label,
      attributes: { type: 'button', 'aria-pressed': String(category.isDefault) },
    }),
  );

  for (const chip of chips) {
    chip.addEventListener('click', (): void => {
      selectChip(chips, chip);
    });
  }

  const row: HTMLUListElement = createElement('ul', {
    className: 'category-filter',
    attributes: { 'aria-label': LIBRARY_CONTENT.categoriesLabel },
    children: chips.map((chip: HTMLButtonElement): HTMLLIElement =>
      createElement('li', { className: 'category-filter__item', children: [chip] }),
    ),
  });
  enableMouseDrag(row);

  return row;
}
