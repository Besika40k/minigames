import type { AuthMode } from './auth.ts';

export enum Route {
  Home = '/',
  Library = '/library',
}

// Where the app is: the path after the app's base, the page of that path
// (undefined when no page has it) and the query, which holds the rest of the
// state
export interface AppLocation {
  readonly path: string;
  readonly route: Route | undefined;
  readonly query: URLSearchParams;
  // "#section" or an empty string, kept when only the query changes
  readonly hash: string;
}

// The query keys of the dialogs that open over any page
export enum DialogParameter {
  Game = 'game',
  Auth = 'auth',
}

// The dialog an address opens over its page: the game of a slug, or the auth
// dialog with the form of a mode
export type OpenDialog =
  | { readonly parameter: DialogParameter.Game; readonly slug: string }
  | { readonly parameter: DialogParameter.Auth; readonly mode: AuthMode };

// What the app keeps in a history entry
export interface HistoryState {
  // The entry was added by opening a dialog, so closing the dialog can go back
  // instead of adding one more entry
  readonly isDialogEntry?: boolean;
}

// A page on the screen
export interface PageView {
  readonly elements: readonly HTMLElement[];
  // Takes a new query while the page stays open, such as another filter
  readonly update?: (location: AppLocation) => void;
  // Stops the page's timers and requests before it leaves the screen
  readonly destroy?: () => void;
}

// How to draw a page, and the name of the browser tab while it is open
export interface PageDefinition {
  readonly title: string;
  readonly render: (location: AppLocation) => PageView;
}

export interface RouteDefinition extends PageDefinition {
  readonly path: Route;
}

export interface PageTitles {
  readonly home: string;
  readonly library: string;
  readonly notFound: string;
}
