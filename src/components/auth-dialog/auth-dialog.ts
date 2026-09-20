import { AUTH_DIALOG_LABEL } from '../../data/auth.ts';
import type { AuthDialog, AuthMode } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { createAuthSwitcher, type AuthSwitcher } from './auth-switcher.ts';
import './auth-dialog.scss';

// A click on the backdrop reaches the dialog itself, but so does a click on the
// dialog's own padding. Only a click outside the dialog's box is on the backdrop.
function isOnBackdrop(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.target !== dialog) {
    return false;
  }

  const box: DOMRect = dialog.getBoundingClientRect();

  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

export function createAuthDialog(): AuthDialog {
  const switcher: AuthSwitcher = createAuthSwitcher();

  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'auth-dialog',
    attributes: { 'aria-label': AUTH_DIALOG_LABEL },
    children: [switcher.tabList, switcher.panels],
  });

  const closeDialog = (): void => {
    dialog.close();
  };

  // Browsers close a modal dialog on Esc by themselves; handling it here as
  // well keeps that requirement visible and independent of the default
  dialog.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    closeDialog();
  });

  // The dialog closes when both the press and the click are on the backdrop, so
  // selecting text inside the dialog and letting go outside keeps it open
  let isPressOnBackdrop = false;
  dialog.addEventListener('pointerdown', (event: PointerEvent): void => {
    isPressOnBackdrop = isOnBackdrop(dialog, event);
  });
  dialog.addEventListener('click', (event: MouseEvent): void => {
    if (isPressOnBackdrop && isOnBackdrop(dialog, event)) {
      closeDialog();
    }
    isPressOnBackdrop = false;
  });

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
