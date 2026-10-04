import { Route } from '../types/route.ts';

// Pure helpers between browser addresses and the app's paths. They read
// nothing from the page, so they work the same everywhere and are easy to test.

// The paths of the pages. "/home" is another name for the Home page.
const ROUTES: ReadonlyMap<string, Route> = new Map([
  ['/', Route.Home],
  ['/home', Route.Home],
  ['/library', Route.Library],
]);

function trimTrailingSlashes(path: string): string {
  return path.replace(/\/+$/, '');
}

// The app's part of a browser path, without a trailing slash. Under the base
// "/minigames/", "/minigames/library/" is "/library" and "/minigames" is "/".
// A path outside the base has no app part.
export function toAppPath(pathname: string, base: string): string | undefined {
  const root: string = trimTrailingSlashes(base);
  if (pathname !== root && !pathname.startsWith(`${root}/`)) {
    return undefined;
  }
  const path: string = trimTrailingSlashes(pathname.slice(root.length));

  return path === '' ? '/' : path;
}

// The browser address of an app path and its query. Under the base
// "/minigames/", "/library" with "page=2" is "/minigames/library?page=2".
export function toBrowserUrl(path: string, query: URLSearchParams, base: string): string {
  const search: string = query.toString();

  return `${trimTrailingSlashes(base)}${path}${search === '' ? '' : `?${search}`}`;
}

// The page of an app path, or undefined when no page has that path
export function parseRoute(path: string): Route | undefined {
  return ROUTES.get(path);
}

// The Story 2 app kept the page in the hash ("#/library"), so the path in an
// old link or bookmark like that is read from there
export function fromLegacyHash(hash: string): string | undefined {
  return hash.startsWith('#/') ? hash.slice(1) : undefined;
}
