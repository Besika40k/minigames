import { AUTH_DIALOG_LABEL } from '../../data/auth.ts';
import type { AuthDialog, AuthMode } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { enableDialogDismiss } from '../../utils/dismiss-dialog.ts';
import { createAuthSwitcher, type AuthSwitcher } from './auth-switcher.ts';
import './auth-dialog.scss';

export interface AuthDialogOptions {
  // Asks to close the dialog: Esc and the backdrop
  readonly onClose: () => void;
}

// The dialog with the login and registration forms. It closes only through
// `onClose`, so the owner decides what a close means (the dialog lives in the
// address).
export function createAuthDialog(options: AuthDialogOptions): AuthDialog {
  const switcher: AuthSwitcher = createAuthSwitcher();

  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'auth-dialog',
    attributes: { 'aria-label': AUTH_DIALOG_LABEL },
    children: [switcher.tabList, switcher.panels],
  });
  enableDialogDismiss(dialog, options.onClose);

  const show = (mode: AuthMode): void => {
    // An open dialog keeps its form
    if (dialog.open) {
      return;
    }
    switcher.select(mode, false);
    dialog.showModal();
    // The browser would focus the first tab, which is not always the selected one
    switcher.focusTab(mode);
  };

  const hide = (): void => {
    if (dialog.open) {
      dialog.close();
    }
  };

  return { element: dialog, show, hide };
}
