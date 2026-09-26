import { AUTH_DIALOG_LABEL } from '../../data/auth.ts';
import type { AuthDialog, AuthMode } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { enableDialogDismiss } from '../../utils/dismiss-dialog.ts';
import { createAuthSwitcher, type AuthSwitcher } from './auth-switcher.ts';
import './auth-dialog.scss';

export function createAuthDialog(): AuthDialog {
  const switcher: AuthSwitcher = createAuthSwitcher();

  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'auth-dialog',
    attributes: { 'aria-label': AUTH_DIALOG_LABEL },
    children: [switcher.tabList, switcher.panels],
  });
  enableDialogDismiss(dialog);

  const open = (mode: AuthMode): void => {
    switcher.select(mode, false);

    if (!dialog.open) {
      dialog.showModal();
    }

    // The browser would focus the first tab, which is not always the selected one
    switcher.focusTab(mode);
  };

  return { element: dialog, open };
}
