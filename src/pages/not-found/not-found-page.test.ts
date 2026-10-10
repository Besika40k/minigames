import { afterEach, describe, expect, it } from 'vitest';
import { NOT_FOUND_CONTENT } from '../../data/not-found.ts';
import { renderNotFoundPage } from './not-found-page.ts';

function renderAt(path: string): HTMLElement {
  globalThis.history.replaceState({}, '', path);
  const main: HTMLElement = document.createElement('main');
  main.append(...renderNotFoundPage());
  document.body.append(main);

  return main;
}

afterEach((): void => {
  document.body.replaceChildren();
  globalThis.history.replaceState({}, '', '/');
});

describe('not found page', (): void => {
  it('names the address that has no page and leads back home', (): void => {
    const main: HTMLElement = renderAt('/games/caf%C3%A9');

    expect(main.querySelector('.not-found__path')?.textContent).toBe('/games/café');
    expect(main.textContent).toContain(NOT_FOUND_CONTENT.title);
    const home: HTMLAnchorElement | null = main.querySelector('a');
    expect(home?.textContent).toBe(NOT_FOUND_CONTENT.homeLinkText);
    expect(home?.getAttribute('href')).toBe('/');
  });

  it('shows a broken escape as it was typed', (): void => {
    const main: HTMLElement = renderAt('/games/100%');

    expect(main.querySelector('.not-found__path')?.textContent).toBe('/games/100%');
  });
});
