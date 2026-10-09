import { AUTH_DIALOG_LABEL } from '../../data/auth.ts';
import type { AuthDialog, AuthMode, AuthRequest } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { enableDialogDismiss } from '../../utils/dismiss-dialog.ts';
import { createAuthSwitcher, type AuthSwitcher } from './auth-switcher.ts';
import './auth-dialog.scss';

export interface AuthDialogOptions {
  // Asks to close the dialog: Esc and the backdrop
  readonly onClose: () => void;
  // Hears of each form the visitor picks: with a tab, an arrow key or the
  // link at the bottom of a form
  readonly onModeChange?: (mode: AuthMode) => void;
  // Signs in or up with the values of a valid form. The dialog stays locked
  // until the promise settles, and the visitor can try again after a failure.
  readonly onSubmit?: (request: AuthRequest) => Promise<void>;
}

// The dialog with the login and registration forms. It closes only through
// `onClose`, so the owner decides what a close means (the dialog lives in the
// address).
export function createAuthDialog(options: AuthDialogOptions): AuthDialog {
  const state: { isPending: boolean; lockedControls: (HTMLButtonElement | HTMLInputElement)[] } = {
    isPending: false,
    lockedControls: [],
  };

  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'auth-dialog',
    // The dialog itself holds the focus while its controls are locked
    attributes: { 'aria-label': AUTH_DIALOG_LABEL, tabindex: '-1' },
  });

  // While a request is under way, every control of the forms and tabs is
  // disabled, so no second request can start, and the dialog cannot be
  // closed. A message shown inside the dialog keeps its close button.
  // Afterwards only the controls locked here come back: a submit button that
  // waits for a valid form stays disabled.
  const setPending = (isPending: boolean): void => {
    state.isPending = isPending;
    dialog.setAttribute('aria-busy', String(isPending));
    if (!isPending) {
      for (const control of state.lockedControls) {
        control.disabled = false;
      }
      state.lockedControls = [];
      return;
    }
    const controls: NodeListOf<HTMLButtonElement | HTMLInputElement> = dialog.querySelectorAll(
      ':scope > .auth-dialog__tabs button, :scope > .auth-dialog__panels :is(button, input)',
    );
    state.lockedControls = [...controls].filter(
      (control: HTMLButtonElement | HTMLInputElement): boolean => !control.disabled,
    );
    for (const control of state.lockedControls) {
      control.disabled = true;
    }
  };

  // A disabled control loses the focus. The dialog takes it, so Esc still
  // reaches the dialog (and is ignored) instead of closing it by default, and
  // gives it back to the control that started the request afterwards. The
  // owner shows the outcome, so a failure here only unlocks the dialog.
  const runLocked = async (action: () => Promise<void>): Promise<void> => {
    if (state.isPending) {
      return;
    }
    const focused: Element | null = document.activeElement;
    setPending(true);
    dialog.focus();
    try {
      await action();
    } catch {
      // The visitor can try again
    } finally {
      setPending(false);
      if (dialog.open && focused instanceof HTMLElement) {
        focused.focus();
      }
    }
  };

  const switcher: AuthSwitcher = createAuthSwitcher({
    onModeChange: (mode: AuthMode): void => {
      options.onModeChange?.(mode);
    },
    onSubmit: async (request: AuthRequest): Promise<void> => {
      await runLocked(async (): Promise<void> => {
        await options.onSubmit?.(request);
      });
    },
  });
  dialog.append(switcher.tabList, switcher.panels);

  enableDialogDismiss(dialog, (): void => {
    if (!state.isPending) {
      options.onClose();
    }
  });

  const show = (mode: AuthMode): void => {
    // An open dialog only switches to another form, so a switch the visitor
    // has just started keeps its animation
    if (dialog.open) {
      if (mode !== switcher.getMode()) {
        switcher.select(mode, true);
      }
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
