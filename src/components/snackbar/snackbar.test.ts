import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FEEDBACK_CONTENT } from '../../data/feedback.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import { showSnackbar } from './snackbar.ts';

// A message stays this long (see the snackbar)
const DISPLAY_TIME = 5000;

function getMessages(): string[] {
  return [...document.querySelectorAll('.snackbar')].map(
    (message: Element): string => `${message.className}: ${message.textContent}`,
  );
}

function getMessage(text: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('.snackbar')].find(
    (message: HTMLElement): boolean => message.textContent === text,
  );
}

beforeEach((): void => {
  vi.useFakeTimers();
  // The fade of a leaving message ends at once
  vi.spyOn(HTMLElement.prototype, 'animate').mockImplementation((): Animation => {
    const fade: EventTarget = new EventTarget();
    setTimeout((): void => {
      fade.dispatchEvent(new Event('finish'));
    }, 0);

    return fade as Animation;
  });
});

afterEach((): void => {
  // Every message leaves, so the next test starts without one
  for (const button of document.querySelectorAll<HTMLButtonElement>('.snackbar__close')) {
    button.click();
  }
  vi.runAllTimers();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('snackbar', (): void => {
  it('shows a message near the top of the page, an error as an alert', (): void => {
    showSnackbar({ variant: SnackbarVariant.Success, text: 'Saved.' });
    showSnackbar({ variant: SnackbarVariant.Error, text: 'Failed.' });

    expect(getMessages()).toEqual([
      'snackbar snackbar--success: Saved.',
      'snackbar snackbar--error: Failed.',
    ]);
    expect(getMessage('Saved.')?.getAttribute('role')).toBe('status');
    expect(getMessage('Failed.')?.getAttribute('role')).toBe('alert');
    expect(document.querySelector('.snackbars')?.parentElement).toBe(document.body);
  });

  it('shows the same message once', (): void => {
    showSnackbar({ variant: SnackbarVariant.Info, text: 'Hello.' });
    showSnackbar({ variant: SnackbarVariant.Info, text: 'Hello.' });

    expect(getMessages()).toHaveLength(1);
  });

  it('goes away by itself, and later again when the same message comes back', (): void => {
    showSnackbar({ variant: SnackbarVariant.Info, text: 'Hello.' });
    vi.advanceTimersByTime(DISPLAY_TIME - 1000);
    // The same message starts its time again
    showSnackbar({ variant: SnackbarVariant.Info, text: 'Hello.' });
    vi.advanceTimersByTime(DISPLAY_TIME - 1000);

    expect(getMessages()).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    vi.runOnlyPendingTimers();

    expect(getMessages()).toEqual([]);
  });

  it('waits while the pointer or the focus is on the message', (): void => {
    showSnackbar({ variant: SnackbarVariant.Warning, text: 'Careful.' });
    const message: HTMLElement | undefined = getMessage('Careful.');

    message?.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(DISPLAY_TIME * 2);
    expect(getMessages()).toHaveLength(1);

    message?.dispatchEvent(new Event('pointerleave'));
    message?.dispatchEvent(new FocusEvent('focusin'));
    vi.advanceTimersByTime(DISPLAY_TIME * 2);
    expect(getMessages()).toHaveLength(1);

    message?.dispatchEvent(new FocusEvent('focusout'));
    vi.advanceTimersByTime(DISPLAY_TIME);
    vi.runOnlyPendingTimers();
    expect(getMessages()).toEqual([]);
  });

  it('closes with its close button', (): void => {
    showSnackbar({ variant: SnackbarVariant.Info, text: 'Hello.' });
    const close: HTMLButtonElement | null | undefined =
      getMessage('Hello.')?.querySelector('.snackbar__close');

    expect(close?.getAttribute('aria-label')).toBe(FEEDBACK_CONTENT.closeMessageLabel);
    close?.click();
    vi.runOnlyPendingTimers();

    expect(getMessages()).toEqual([]);
  });

  it('keeps the three newest messages', (): void => {
    for (const text of ['One.', 'Two.', 'Three.', 'Four.']) {
      showSnackbar({ variant: SnackbarVariant.Info, text });
    }
    vi.runOnlyPendingTimers();

    expect(getMessages()).toEqual([
      'snackbar snackbar--info: Two.',
      'snackbar snackbar--info: Three.',
      'snackbar snackbar--info: Four.',
    ]);
  });

  it('shows the messages inside an open modal dialog, and outside once it closes', (): void => {
    const dialog: HTMLDialogElement = document.createElement('dialog');
    document.body.append(dialog);
    // The test DOM does not know :modal; a browser matches an open modal dialog
    vi.spyOn(dialog, 'matches').mockImplementation(
      (selector: string): boolean => selector === ':modal' && dialog.open,
    );
    dialog.showModal();

    showSnackbar({ variant: SnackbarVariant.Info, text: 'Inside.' });
    expect(document.querySelector('.snackbars')?.parentElement).toBe(dialog);

    dialog.close();
    dialog.dispatchEvent(new Event('close'));
    expect(document.querySelector('.snackbars')?.parentElement).toBe(document.body);
  });
});
