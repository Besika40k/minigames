import { Route } from '../types/route.ts';
import type { NavigationLink } from '../types/navigation.ts';

// Only the Home page exists in Story 1, so every link points to it.
export const NAVIGATION_LINKS: readonly NavigationLink[] = [
  { label: 'Home', route: Route.Home, isCurrent: true },
  { label: 'Library', route: Route.Home, isCurrent: false },
  { label: 'Tournaments', route: Route.Home, isCurrent: false },
  { label: 'Community', route: Route.Home, isCurrent: false },
];
