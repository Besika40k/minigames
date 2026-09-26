import { Route } from '../types/route.ts';
import type { NavigationLink } from '../types/navigation.ts';

// Home and Library are real pages; Tournaments and Community do not exist yet
export const NAVIGATION_LINKS: readonly NavigationLink[] = [
  { label: 'Home', page: Route.Home },
  { label: 'Library', page: Route.Library },
  { label: 'Tournaments' },
  { label: 'Community' },
];
