import type { AuthMode } from './auth.ts';
import type { Route } from './route.ts';
import type { AppSession } from './session.ts';

export interface BurgerMenuOptions {
  readonly trigger: HTMLButtonElement;
  // Called after the menu has closed, with the form the pressed button asks for
  readonly onAuthClick?: (mode: AuthMode) => void;
}

export interface BurgerMenu {
  readonly element: HTMLDialogElement;
  // Marks the menu link of the open page
  readonly setCurrentPage: (page: Route | undefined) => void;
  // Shows the profile of a signed-in user in place of Log In and Sign Up, and
  // the buttons again for a guest
  readonly setSession: (session: AppSession | undefined) => void;
}
