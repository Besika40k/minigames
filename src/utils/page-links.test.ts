import { describe, expect, it } from 'vitest';
import { Route } from '../types/route.ts';
import { PageLinks } from './page-links.ts';

function createLink(): HTMLAnchorElement {
  return document.createElement('a');
}

describe('PageLinks', (): void => {
  it('marks the link of the open page as current and the others as not', (): void => {
    const links: PageLinks = new PageLinks();
    const homeLink: HTMLAnchorElement = createLink();
    const libraryLink: HTMLAnchorElement = createLink();
    links.add(homeLink, Route.Home);
    links.add(libraryLink, Route.Library);

    links.markCurrent(Route.Library);

    expect(homeLink.getAttribute('aria-current')).toBe('false');
    expect(libraryLink.getAttribute('aria-current')).toBe('page');
  });

  it('moves the mark when another page opens', (): void => {
    const links: PageLinks = new PageLinks();
    const homeLink: HTMLAnchorElement = createLink();
    const libraryLink: HTMLAnchorElement = createLink();
    links.add(homeLink, Route.Home);
    links.add(libraryLink, Route.Library);

    links.markCurrent(Route.Library);
    links.markCurrent(Route.Home);

    expect(homeLink.getAttribute('aria-current')).toBe('page');
    expect(libraryLink.getAttribute('aria-current')).toBe('false');
  });

  it('marks no link on a page without one, such as the not found page', (): void => {
    const links: PageLinks = new PageLinks();
    const homeLink: HTMLAnchorElement = createLink();
    links.add(homeLink, Route.Home);

    links.markCurrent(undefined);

    expect(homeLink.getAttribute('aria-current')).toBe('false');
  });
});
