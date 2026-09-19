import { Route, type RouteDefinition } from '../types/route.ts';

type PageRenderer = () => readonly HTMLElement[];

// Routes live in the URL hash (#/), so the app works on any static host
// without server-side fallback rules.
export function getRouteHref(route: Route): string {
  return `#${route}`;
}

export class Router {
  private readonly routes: Map<string, RouteDefinition>;
  private readonly outlet: HTMLElement;
  private readonly renderNotFound: PageRenderer;

  public constructor(
    routes: readonly RouteDefinition[],
    outlet: HTMLElement,
    renderNotFound: PageRenderer,
  ) {
    const entries: [string, RouteDefinition][] = routes.map(
      (route: RouteDefinition): [string, RouteDefinition] => [route.path, route],
    );
    this.routes = new Map(entries);
    this.outlet = outlet;
    this.renderNotFound = renderNotFound;
  }

  private getCurrentPath(): string {
    const path: string = globalThis.location.hash.slice(1);
    return path === '' ? Route.Home : path;
  }

  private render(): void {
    const route: RouteDefinition | undefined = this.routes.get(this.getCurrentPath());
    const page: readonly HTMLElement[] = route?.render() ?? this.renderNotFound();
    this.outlet.replaceChildren(...page);
  }

  public start(): void {
    globalThis.addEventListener('hashchange', () => {
      this.render();
    });
    this.render();
  }
}
