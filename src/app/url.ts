import { AuthMode } from '../types/auth.ts';
import { DialogParameter, Route, type OpenDialog } from '../types/route.ts';

// Pure helpers between browser addresses and the app's paths. They read
// nothing from the page, so they work the same everywhere and are easy to test.

// The paths of the pages. "/home" is another name for the Home page.
const ROUTES: ReadonlyMap<string, Route> = new Map([
  ['/', Route.Home],
  ['/home', Route.Home],
  ['/library', Route.Library],
]);

const AUTH_MODES: ReadonlySet<string> = new Set<string>(Object.values(AuthMode));

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

// The browser address of an app path, its query and its hash. Under the base
// "/minigames/", "/library" with "page=2" is "/minigames/library?page=2".
export function toBrowserUrl(
  path: string,
  query: URLSearchParams,
  base: string,
  hash: string = '',
): string {
  const search: string = query.toString();

  return `${trimTrailingSlashes(base)}${path}${search === '' ? '' : `?${search}`}${hash}`;
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

function isAuthMode(value: string): value is AuthMode {
  return AUTH_MODES.has(value);
}

// The dialog an address opens over its page. One dialog opens at a time: a
// game wins over the auth dialog, which also needs a mode it has.
export function parseDialog(query: URLSearchParams): OpenDialog | undefined {
  const slug: string = query.get(DialogParameter.Game) ?? '';
  if (slug !== '') {
    return { parameter: DialogParameter.Game, slug };
  }
  const mode: string = query.get(DialogParameter.Auth) ?? '';

  return isAuthMode(mode) ? { parameter: DialogParameter.Auth, mode } : undefined;
}

// The query without the dialog parameters that open nothing, such as an
// unknown auth mode or an auth mode next to a game. Undefined when every
// dialog parameter of the query is in use.
export function removeUnusedDialogParameters(
  query: URLSearchParams,
  dialog: OpenDialog | undefined,
): URLSearchParams | undefined {
  const unused: DialogParameter[] = Object.values(DialogParameter).filter(
    (parameter: DialogParameter): boolean =>
      query.has(parameter) && parameter !== dialog?.parameter,
  );
  if (unused.length === 0) {
    return undefined;
  }

  const corrected: URLSearchParams = new URLSearchParams(query);
  for (const parameter of unused) {
    corrected.delete(parameter);
  }

  return corrected;
}
