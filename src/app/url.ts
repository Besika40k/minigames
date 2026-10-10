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

// What an address asks of the dialogs
export interface DialogDecision {
  // The dialog to show, or undefined for none
  readonly dialog: OpenDialog | undefined;
  // The query without the dialog parameters that open nothing, or undefined
  // when every dialog parameter of the address is in use
  readonly correctedQuery: URLSearchParams | undefined;
  // A signed-in user asked for the auth dialog, which stays closed
  readonly isAuthBlocked: boolean;
}

// The dialog an address opens over its page. One dialog opens at a time. The
// auth dialog needs a known mode and a guest; it goes over a game, which stays
// in the address and comes back when the auth dialog closes. A parameter that
// opens nothing (an unknown mode, an empty game, or the auth dialog of a
// signed-in user) leaves the address.
export function decideDialog(query: URLSearchParams, isSignedIn: boolean): DialogDecision {
  const slug: string = query.get(DialogParameter.Game) ?? '';
  const modeText: string = query.get(DialogParameter.Auth) ?? '';
  const mode: AuthMode | undefined = isAuthMode(modeText) ? modeText : undefined;
  const isAuthBlocked: boolean = mode !== undefined && isSignedIn;

  const authDialog: OpenDialog | undefined =
    mode === undefined || isSignedIn ? undefined : { parameter: DialogParameter.Auth, mode };
  const gameDialog: OpenDialog | undefined =
    slug === '' ? undefined : { parameter: DialogParameter.Game, slug };

  const unused: DialogParameter[] = [
    ...(authDialog === undefined && query.has(DialogParameter.Auth) ? [DialogParameter.Auth] : []),
    ...(gameDialog === undefined && query.has(DialogParameter.Game) ? [DialogParameter.Game] : []),
  ];
  const correctedQuery: URLSearchParams = new URLSearchParams(query);
  for (const parameter of unused) {
    correctedQuery.delete(parameter);
  }

  return {
    dialog: authDialog ?? gameDialog,
    correctedQuery: unused.length === 0 ? undefined : correctedQuery,
    isAuthBlocked,
  };
}
