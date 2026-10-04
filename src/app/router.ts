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

// Every page has a real path, kept in the address through the History API
export class Router {
  private readonly routes: Map<Route, RouteDefinition>;
  private readonly outlet: HTMLElement;
  private readonly renderNotFound: PageRenderer;

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

  private render(onPageChange: PageChangeListener): void {
    const page: Route | undefined = readRoute();
    const route: RouteDefinition | undefined =
      page === undefined ? undefined : this.routes.get(page);
    this.outlet.replaceChildren(...(route?.render() ?? this.renderNotFound()));
    onPageChange(route?.path);
    // A new page opens at its top
    globalThis.scrollTo({ top: 0, behavior: 'instant' });
  }

  public start(onPageChange: PageChangeListener): void {
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
      this.render(onPageChange);
    });
    this.render(onPageChange);
  }
}
