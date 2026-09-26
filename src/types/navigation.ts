import type { Route } from './route.ts';

export interface NavigationLink {
  readonly label: string;
  // The page the link opens. Links without one have no page in the mockup yet:
  // they lead to Home and are never marked as the open page.
  readonly page?: Route;
}
