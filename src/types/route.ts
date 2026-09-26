export enum Route {
  Home = '/',
  Library = '/library',
}

export interface RouteDefinition {
  readonly path: Route;
  readonly render: () => readonly HTMLElement[];
}
