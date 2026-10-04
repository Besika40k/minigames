import type { Route, RouteDefinition } from '../types/route.ts';
import { fromLegacyHash, parseRoute, toAppPath, toBrowserUrl } from './url.ts';

type PageRenderer = () => readonly HTMLElement[];

// Called after each render with the open page (undefined for an unknown address)
type PageChangeListener = (page: Route | undefined) => void;

// The address the app is served from: "/" in development and "/minigames/" on
// GitHub Pages (the `base` option of the build)
const BASE_PATH: string = import.meta.env.BASE_URL;

// The real address of a page, so a link to it also works in a new tab
export function getRouteHref(route: Route): string {
  return toBrowserUrl(route, new URLSearchParams(), BASE_PATH);
}

// The page of the address in the browser, or undefined when no page has it
function readRoute(): Route | undefined {
  const path: string | undefined = toAppPath(globalThis.location.pathname, BASE_PATH);

  return path === undefined ? undefined : parseRoute(path);
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

// Every page has a real path, kept in the address through the History API.
// Links and Back/Forward never load the document again.
export class Router {
  private readonly routes: Map<Route, RouteDefinition>;
  private readonly outlet: HTMLElement;
  private readonly renderNotFound: PageRenderer;
  private onPageChange: PageChangeListener | undefined;

  public constructor(
    routes: readonly RouteDefinition[],
    outlet: HTMLElement,
    renderNotFound: PageRenderer,
  ) {
    const entries: [Route, RouteDefinition][] = routes.map(
      (route: RouteDefinition): [Route, RouteDefinition] => [route.path, route],
    );
    this.routes = new Map(entries);
    this.outlet = outlet;
    this.renderNotFound = renderNotFound;
  }

  private render(): void {
    const page: Route | undefined = readRoute();
    const route: RouteDefinition | undefined =
      page === undefined ? undefined : this.routes.get(page);
    this.outlet.replaceChildren(...(route?.render() ?? this.renderNotFound()));
    this.onPageChange?.(route?.path);
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
    this.navigate(path, url.searchParams);
  }

  public start(onPageChange: PageChangeListener): void {
    this.onPageChange = onPageChange;

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

    // Back and Forward between the entries of the app
    globalThis.addEventListener('popstate', (): void => {
      this.render();
    });
    document.addEventListener('click', (event: MouseEvent): void => {
      this.handleLinkClick(event);
    });
    this.render();
  }

  // Opens a page of the app in a new history entry
  public navigate(path: string, query: URLSearchParams = new URLSearchParams()): void {
    globalThis.history.pushState({}, '', toBrowserUrl(path, query, BASE_PATH));
    this.render();
  }
}
