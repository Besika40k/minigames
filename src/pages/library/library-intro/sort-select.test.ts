import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SortOrder } from '../../../types/library.ts';
import { createSortSelect, type SortSelect } from './sort-select.ts';

interface TestSelect {
  readonly select: SortSelect;
  readonly trigger: HTMLButtonElement;
  readonly list: HTMLElement;
  readonly onSelect: Mock<(order: SortOrder) => void>;
}

function renderSelect(): TestSelect {
  const onSelect: Mock<(order: SortOrder) => void> = vi.fn<(order: SortOrder) => void>();
  const select: SortSelect = createSortSelect({ onSelect });
  document.body.append(select.element);
  const trigger: HTMLButtonElement | null = select.element.querySelector('button');
  const list: HTMLElement | null = select.element.querySelector('[role="listbox"]');
  if (trigger === null || list === null) {
    throw new Error('The sort control has no button or list.');
  }

  return { select, trigger, list, onSelect };
}

function press(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
}

// The text of the highlighted option
function getActive(list: HTMLElement): string | undefined {
  const id: string | null = list.getAttribute('aria-activedescendant');

  return id === null ? undefined : (list.querySelector(`#${id}`)?.textContent ?? undefined);
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('sort select', (): void => {
  it('shows the order of the address on its button', (): void => {
    const { select, trigger } = renderSelect();

    select.setSelected(SortOrder.NameDescending);

    expect(trigger.textContent).toBe('Sort by: Name Z→A');
    expect(trigger.getAttribute('aria-label')).toBe('Sort by: Name, Z to A');
  });

  it('opens on a click with the selected order highlighted, and closes on another', (): void => {
    const { trigger, list } = renderSelect();

    trigger.click();
    expect(list.hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(getActive(list)).toBe('Rating ↓');
    expect(document.activeElement).toBe(list);

    trigger.click();
    expect(list.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('moves through the options with the keys and picks one with Enter', (): void => {
    const { trigger, list, onSelect } = renderSelect();

    press(trigger, 'ArrowDown');
    expect(list.hidden).toBe(false);

    press(list, 'ArrowDown');
    expect(getActive(list)).toBe('Name A→Z');
    press(list, 'End');
    press(list, 'ArrowDown');
    expect(getActive(list)).toBe('Name Z→A');
    press(list, 'Home');
    press(list, 'ArrowUp');
    expect(getActive(list)).toBe('Rating ↑');

    press(list, 'Enter');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(SortOrder.RatingAscending);
    expect(list.hidden).toBe(true);
  });

  it('closes with Escape without picking anything', (): void => {
    const { trigger, list, onSelect } = renderSelect();
    trigger.click();

    press(list, 'Escape');

    expect(list.hidden).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('highlights the option under the pointer and picks it with a click', (): void => {
    const { trigger, list, onSelect } = renderSelect();
    trigger.click();
    const option: HTMLElement | undefined = [
      ...list.querySelectorAll<HTMLElement>('[role="option"]'),
    ].find((item: HTMLElement): boolean => item.textContent === 'Name A→Z');

    option?.dispatchEvent(new Event('pointerenter'));
    expect(getActive(list)).toBe('Name A→Z');
    option?.click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(SortOrder.NameAscending);
  });

  it('closes when the focus leaves for something else', (): void => {
    const { trigger, list } = renderSelect();
    trigger.click();

    list.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));

    expect(list.hidden).toBe(true);
  });
});
