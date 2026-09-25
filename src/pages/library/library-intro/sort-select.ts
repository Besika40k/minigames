import { DEFAULT_SORT_ORDER, LIBRARY_CONTENT, SORT_OPTIONS } from '../../../data/library.ts';
import type { SortOption, SortOrder } from '../../../types/library.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import './sort-select.scss';

const LIST_ID = 'sort-select-list';

interface OptionItem {
  readonly option: SortOption;
  readonly element: HTMLLIElement;
}

function createOptionItem(option: SortOption): OptionItem {
  const element: HTMLLIElement = createElement('li', {
    className: 'sort-select__option',
    attributes: {
      id: `sort-option-${option.order}`,
      role: 'option',
      'aria-selected': 'false',
      'aria-label': option.spokenLabel,
    },
    children: [createIcon(IconName.Check), createElement('span', { text: option.label })],
  });

  return { option, element };
}

function findItem(items: readonly OptionItem[], order: SortOrder): OptionItem {
  const item: OptionItem | undefined = items.find(
    (candidate: OptionItem): boolean => candidate.option.order === order,
  );
  if (item === undefined) {
    throw new Error(`No sort option for "${order}"`);
  }

  return item;
}

// The keys that move through the open list, as in the ARIA listbox pattern.
// The list does not wrap around.
function getTargetIndex(key: string, current: number, count: number): number | undefined {
  const lastIndex: number = count - 1;
  const targets: Readonly<Record<string, number>> = {
    ArrowDown: Math.min(current + 1, lastIndex),
    ArrowUp: Math.max(current - 1, 0),
    Home: 0,
    End: lastIndex,
  };

  return targets[key];
}

// A button that shows the chosen sort order and opens the list of orders under
// it. The list keeps the focus while it is open and points at the highlighted
// option with aria-activedescendant.
export function createSortSelect(): HTMLElement {
  const items: OptionItem[] = SORT_OPTIONS.map((option: SortOption): OptionItem =>
    createOptionItem(option),
  );
  let selected: OptionItem = findItem(items, DEFAULT_SORT_ORDER);
  let active: OptionItem = selected;

  const label: HTMLSpanElement = createElement('span', { className: 'sort-select__label' });
  const trigger: HTMLButtonElement = createElement('button', {
    className: 'sort-select__trigger',
    attributes: {
      type: 'button',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': LIST_ID,
    },
    children: [label, createIcon(IconName.ArrowDropDown)],
  });

  const list: HTMLUListElement = createElement('ul', {
    className: 'sort-select__list',
    attributes: {
      id: LIST_ID,
      role: 'listbox',
      tabindex: '-1',
      'aria-label': LIBRARY_CONTENT.sortListLabel,
    },
    children: items.map((item: OptionItem): HTMLLIElement => item.element),
  });
  list.hidden = true;

  const showSelected = (): void => {
    label.textContent = `${LIBRARY_CONTENT.sortPrefix} ${selected.option.label}`;
    trigger.setAttribute(
      'aria-label',
      `${LIBRARY_CONTENT.sortPrefix} ${selected.option.spokenLabel}`,
    );
    for (const item of items) {
      item.element.setAttribute('aria-selected', String(item === selected));
    }
  };

  // The highlighted option: the one the arrow keys reached or the pointer is on
  const highlight = (target: OptionItem): void => {
    active = target;
    list.setAttribute('aria-activedescendant', target.element.id);
    for (const item of items) {
      item.element.classList.toggle('sort-select__option--active', item === target);
    }
  };

  const open = (): void => {
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    highlight(selected);
    list.focus();
  };

  const close = (isFocusReturned: boolean): void => {
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (isFocusReturned) {
      trigger.focus();
    }
  };

  const select = (item: OptionItem): void => {
    selected = item;
    showSelected();
    close(true);
  };

  trigger.addEventListener('click', (): void => {
    if (list.hidden) {
      open();
      return;
    }
    close(true);
  });

  // The arrow keys open the list too
  trigger.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    open();
  });

  list.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(active);
      return;
    }

    const target: number | undefined = getTargetIndex(
      event.key,
      items.indexOf(active),
      items.length,
    );
    const targetItem: OptionItem | undefined = target === undefined ? undefined : items[target];
    if (targetItem === undefined) {
      return;
    }
    event.preventDefault();
    highlight(targetItem);
  });

  // Tab, a click anywhere else or any other move of the focus out of the
  // control closes the list. The trigger is inside, so its own click still
  // toggles the list.
  list.addEventListener('focusout', (event: FocusEvent): void => {
    const isInside: boolean =
      event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget);
    if (!isInside) {
      close(false);
    }
  });

  for (const item of items) {
    item.element.addEventListener('pointerenter', (): void => {
      highlight(item);
    });
    item.element.addEventListener('click', (): void => {
      select(item);
    });
  }

  showSelected();

  return createElement('div', { className: 'sort-select', children: [trigger, list] });
}
