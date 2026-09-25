import { CATEGORIES, LIBRARY_CONTENT } from '../../../data/library.ts';
import type { Category } from '../../../types/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import './category-filter.scss';

// Marks one chip as pressed and the others as not. The picked chip slides fully
// into view when the row clips it.
function selectChip(chips: readonly HTMLButtonElement[], selected: HTMLButtonElement): void {
  for (const chip of chips) {
    chip.setAttribute('aria-pressed', String(chip === selected));
  }
  selected.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}

// The category chips. One is pressed at a time; the row never wraps, and what
// does not fit is clipped and can be swiped into view.
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

  return row;
}
