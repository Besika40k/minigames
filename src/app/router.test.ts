import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  Route,
  type AppLocation,
  type PageDefinition,
  type PageView,
  type RouteDefinition,
} from '../types/route.ts';
import { getRouteHref, Router } from './router.ts';

type Render = Mock<(location: AppLocation) => PageView>;
type Listener = Mock<(location: AppLocation) => void>;

interface TestPage {
  readonly render: Render;
  readonly update: Mock<(location: AppLocation) => void>;
  readonly destroy: Mock<() => void>;
}

// A page that draws a heading with its name
function createTestPage(name: string): TestPage {
  const update: Mock<(location: AppLocation) => void> = vi.fn<(location: AppLocation) => void>();
  const destroy: Mock<() => void> = vi.fn<() => void>();
  const render: Render = vi.fn<(location: AppLocation) => PageView>((): PageView => {
    const heading: HTMLHeadingElement = document.createElement('h1');
    heading.textContent = name;

    return { elements: [heading], update, destroy };
  });

  return { render, update, destroy };
}

const home: TestPage = createTestPage('Home');
const library: TestPage = createTestPage('Library');
const notFound: TestPage = createTestPage('Not found');
const outlet: HTMLElement = document.createElement('main');
const listener: Listener = vi.fn<(location: AppLocation) => void>();

const routes: readonly RouteDefinition[] = [
  { path: Route.Home, title: 'Home page', render: home.render },
  { path: Route.Library, title: 'Library page', render: library.render },
];
const notFoundPage: PageDefinition = { title: 'Not found page', render: notFound.render };

// The router listens to the whole window, so one router serves every test
const router: Router = new Router(routes, notFoundPage, outlet);

function getHeading(): string {
  return outlet.querySelector('h1')?.textContent ?? '';
}

function clickLink(href: string, init: MouseEventInit = {}): MouseEvent {
  const link: HTMLAnchorElement = document.createElement('a');
  link.href = href;
  document.body.append(link);
  const event: MouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  link.dispatchEvent(event);
  link.remove();

  return event;
}

beforeAll((): void => {
  document.body.append(outlet);
  // An old link from the hash router of Story 2
  globalThis.history.replaceState({}, '', '/?sort=name-asc#/library');
  router.onChange((location: AppLocation): void => {
    listener(location);
  });
  router.start();
});

beforeEach((): void => {
  listener.mockClear();
});

describe('Router', (): void => {
  it('moves the page of an old hash link to the path and draws it', (): void => {
    expect(globalThis.location.pathname).toBe('/library');
    expect(globalThis.location.search).toBe('?sort=name-asc');
    expect(getHeading()).toBe('Library');
    expect(router.location.route).toBe(Route.Library);
  });

  it('opens another page in a new history entry and tells the listeners', (): void => {
    const length: number = globalThis.history.length;

    router.navigate({ path: Route.Home, query: new URLSearchParams('x=1') });

    expect(globalThis.location.pathname + globalThis.location.search).toBe('/?x=1');
    expect(globalThis.history.length).toBe(length + 1);
    expect(getHeading()).toBe('Home');
    expect(document.title).toBe('Home page');
    expect(library.destroy).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ path: '/', route: Route.Home }),
    );
  });

  it('hands a new query of the open page to that page instead of drawing it again', (): void => {
    router.navigate({ path: Route.Library });
    library.render.mockClear();

    router.navigate({ query: new URLSearchParams('page=2') });

    expect(library.render).not.toHaveBeenCalled();
    expect(library.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: new URLSearchParams('page=2') }),
    );
    expect(router.location.query.get('page')).toBe('2');
  });

  it('replaces the current entry and keeps its history state', (): void => {
    router.navigate(
      { query: new URLSearchParams('game=chess') },
      { state: { isDialogEntry: true } },
    );
    expect(router.isDialogEntry).toBe(true);
    const length: number = globalThis.history.length;

    router.navigate({ query: new URLSearchParams() }, { isReplace: true });

    expect(globalThis.history.length).toBe(length);
    expect(globalThis.location.search).toBe('');
    expect(router.isDialogEntry).toBe(true);
  });

  it('keeps the hash it is given', (): void => {
    router.navigate({ query: new URLSearchParams('auth=login'), hash: '#top' });

    expect(globalThis.location.hash).toBe('#top');
    expect(router.location.hash).toBe('#top');

    router.navigate({ query: new URLSearchParams() }, { isReplace: true });
    expect(globalThis.location.hash).toBe('');
  });

  it('draws the not found page for an unknown path, anew for each one', (): void => {
    router.navigate({ path: '/games' });
    expect(getHeading()).toBe('Not found');
    expect(router.location.route).toBeUndefined();

    router.navigate({ path: '/other' });
    expect(notFound.render).toHaveBeenCalledTimes(2);
  });

  it('follows Back and Forward through popstate', (): void => {
    globalThis.history.replaceState({}, '', '/home');
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(getHeading()).toBe('Home');
    expect(router.location.path).toBe('/home');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('goes back through the browser', (): void => {
    const back: Mock<() => void> = vi.spyOn(globalThis.history, 'back').mockReturnValue();

    router.back();

    expect(back).toHaveBeenCalledOnce();
  });
});

describe('Router links', (): void => {
  it('opens a plain click on an app link without loading the document', (): void => {
    const event: MouseEvent = clickLink('/library?page=3');

    expect(event.defaultPrevented).toBe(true);
    expect(globalThis.location.pathname + globalThis.location.search).toBe('/library?page=3');
    expect(getHeading()).toBe('Library');
  });

  it('leaves a click with a modifier key and a link to another site to the browser', (): void => {
    expect(clickLink('/home', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(clickLink('https://example.com/library').defaultPrevented).toBe(false);
    expect(globalThis.location.pathname).toBe('/library');
  });

  it('scrolls to the top for a link to the open address', (): void => {
    const scroll: Mock<typeof globalThis.scrollTo> = vi
      .spyOn(globalThis, 'scrollTo')
      .mockReturnValue();
    const length: number = globalThis.history.length;

    clickLink(globalThis.location.href);

    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(globalThis.history.length).toBe(length);
  });

  it('gives the real address of a page', (): void => {
    expect(getRouteHref(Route.Library)).toBe('/library');
    expect(getRouteHref(Route.Home)).toBe('/');
  });
});
