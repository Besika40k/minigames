import type {
  AppLocation,
  PageDefinition,
  PageView,
  Route,
  RouteDefinition,
} from '../types/route.ts';
import { fromLegacyHash, parseRoute, toAppPath, toBrowserUrl } from './url.ts';

// The address the app is served from: "/" in development and "/minigames/" on
// GitHub Pages (the `base` option of the build)
const BASE_PATH: string = import.meta.env.BASE_URL;

export interface NavigationTarget {
  // The app path of the page; the open page when it is left out
  readonly path?: string;
  // The whole new query; an empty one when it is left out
  readonly query?: URLSearchParams;
}

export interface NavigationOptions {
  // Changes the current history entry instead of adding one, so Back skips
  // the change (for example a corrected address)
  readonly isReplace?: boolean;
}

// Called after every change of the address, once the page has caught up
type LocationListener = (location: AppLocation) => void;

// The real address of a page, so a link to it also works in a new tab
export function getRouteHref(route: Route): string {
  return toBrowserUrl(route, new URLSearchParams(), BASE_PATH);
}

// Where the browser is now, in the app's terms
function readLocation(): AppLocation {
  const { pathname, search } = globalThis.location;
  const path: string | undefined = toAppPath(pathname, BASE_PATH);

  return {
    path: path ?? pathname,
    route: path === undefined ? undefined : parseRoute(path),
    query: new URLSearchParams(search),
  };
}

// Two addresses show the same page when their routes match. Each unknown path
// is a page of its own, because the 404 view names it.
function getPageKey(location: AppLocation): string {
  return location.route ?? `not-found:${location.path}`;
}

// A left click without a modifier key, which opens a link in the same tab
function isPlainClick(event: MouseEvent): boolean {
  const hasModifier: boolean = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

  return !event.defaultPrevented && event.button === 0 && !hasModifier;
}

// The address of the clicked link, when the app can open it itself. Links
// for another tab, downloads and other sites are left to the browser.
function findAppLink(target: EventTarget | null): URL | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }
  const link: Element | null = target.closest('a[href]');
  if (!(link instanceof HTMLAnchorElement) || link.target !== '' || link.hasAttribute('download')) {
    return undefined;
  }
  const url: URL = new URL(link.href);

  return url.origin === globalThis.location.origin ? url : undefined;
}

// The router of the single-page app. Every page has a real path, and the
// query keeps the rest of the state, so the address alone restores what is on
// the screen. Changes go through the History API: links and Back/Forward
// never load the document again.
export class Router {
  private readonly routes: ReadonlyMap<Route, RouteDefinition>;
  private readonly notFound: PageDefinition;
  private readonly outlet: HTMLElement;
  private readonly listeners: LocationListener[] = [];
  private current: AppLocation = readLocation();
  private view: PageView | undefined;
  private pageKey: string | undefined;

  public constructor(
    routes: readonly RouteDefinition[],
    notFound: PageDefinition,
    outlet: HTMLElement,
  ) {
    const entries: [Route, RouteDefinition][] = routes.map(
      (definition: RouteDefinition): [Route, RouteDefinition] => [definition.path, definition],
    );
    this.routes = new Map(entries);
    this.notFound = notFound;
    this.outlet = outlet;
  }

  // Draws the page of the address when another page opens, and hands a new
  // query of the open page to that page
  private update(): void {
    const location: AppLocation = readLocation();
    const pageKey: string = getPageKey(location);
    this.current = location;

    if (pageKey === this.pageKey) {
      this.view?.update?.(location);
    } else {
      this.pageKey = pageKey;
      this.showPage(location);
    }

    for (const listener of this.listeners) {
      listener(location);
    }
  }

  private showPage(location: AppLocation): void {
    const route: RouteDefinition | undefined =
      location.route === undefined ? undefined : this.routes.get(location.route);
    const definition: PageDefinition = route ?? this.notFound;

    this.view?.destroy?.();
    this.view = definition.render(location);
    this.outlet.replaceChildren(...this.view.elements);
    document.title = definition.title;
    // A new page opens at its top
    globalThis.scrollTo({ top: 0, behavior: 'instant' });
  }

  // A plain click on a link to a page of the app opens that page here
  // without loading the document. A link to the open address goes back to the
  // top of the page, as a reload would.
  private handleLinkClick(event: MouseEvent): void {
    const url: URL | undefined = isPlainClick(event) ? findAppLink(event.target) : undefined;
    const path: string | undefined =
      url === undefined ? undefined : toAppPath(url.pathname, BASE_PATH);
    if (url === undefined || path === undefined) {
      return;
    }

    event.preventDefault();
    if (url.href === globalThis.location.href) {
      globalThis.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    this.navigate({ path, query: url.searchParams });
  }

  public get location(): AppLocation {
    return this.current;
  }

  public onChange(listener: LocationListener): void {
    this.listeners.push(listener);
  }

  public start(): void {
    // An old link keeps working: its page moves from the hash to the path
    const legacyPath: string | undefined = fromLegacyHash(globalThis.location.hash);
    if (legacyPath !== undefined) {
      const query: URLSearchParams = new URLSearchParams(globalThis.location.search);
      globalThis.history.replaceState(
        globalThis.history.state,
        '',
        toBrowserUrl(legacyPath, query, BASE_PATH),
      );
    }

    globalThis.addEventListener('popstate', (): void => {
      this.update();
    });
    document.addEventListener('click', (event: MouseEvent): void => {
      this.handleLinkClick(event);
    });
    this.update();
  }

  // Opens an address of the app. Each change is a new history entry unless
  // it replaces the current one; a replaced entry keeps its history state.
  public navigate(target: NavigationTarget, options: NavigationOptions = {}): void {
    const url: string = toBrowserUrl(
      target.path ?? this.current.path,
      target.query ?? new URLSearchParams(),
      BASE_PATH,
    );

    if (options.isReplace === true) {
      globalThis.history.replaceState(globalThis.history.state, '', url);
    } else {
      globalThis.history.pushState({}, '', url);
    }
    this.update();
  }
}
