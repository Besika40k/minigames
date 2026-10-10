import { afterEach, describe, expect, it } from 'vitest';
import { isDisplayed } from './is-displayed.ts';

afterEach((): void => {
  document.body.replaceChildren();
});

describe('isDisplayed', (): void => {
  it('tells an element the styles show from one they hide', (): void => {
    const shown: HTMLElement = document.createElement('button');
    const hidden: HTMLElement = document.createElement('button');
    hidden.style.display = 'none';
    document.body.append(shown, hidden);

    expect(isDisplayed(shown)).toBe(true);
    expect(isDisplayed(hidden)).toBe(false);
  });
});
