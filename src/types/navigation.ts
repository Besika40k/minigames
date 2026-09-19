import type { Route } from './route.ts';

export interface NavigationLink {
  readonly label: string;
  readonly route: Route;
  readonly isCurrent: boolean;
}
