export enum Route {
  Home = '/',
}

export interface RouteDefinition {
  readonly path: Route;
  readonly render: () => readonly HTMLElement[];
}
