import type { AuthMode } from './auth.ts';

export interface BurgerMenuOptions {
  readonly trigger: HTMLButtonElement;
  // Called after the menu has closed, with the form the pressed button asks for
  readonly onAuthClick?: (mode: AuthMode) => void;
}
