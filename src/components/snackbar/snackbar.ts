import { FEEDBACK_CONTENT } from '../../data/feedback.ts';
import { SnackbarVariant, type SnackbarMessage } from '../../types/feedback.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import './snackbar.scss';

// A message stays this long, counted again after the pointer or the focus
// leaves it
const DISPLAY_TIME = 5000;
// A new message pushes the oldest out beyond this many
const MAX_MESSAGES = 3;
// The fade of a message that leaves (the medium duration of the styles)
const LEAVE_DURATION = 300;

const ICONS: Readonly<Record<SnackbarVariant, IconName>> = {
  [SnackbarVariant.Success]: IconName.Success,
  [SnackbarVariant.Error]: IconName.Error,
  [SnackbarVariant.Warning]: IconName.Warning,
  [SnackbarVariant.Info]: IconName.Info,
};

interface ShownMessage {
  readonly key: string;
  readonly restartTimer: () => void;
  readonly dismiss: () => void;
}

const shownMessages: ShownMessage[] = [];

// The one region that holds the messages
const region: HTMLElement = createElement('div', { className: 'snackbars' });

// A modal dialog makes the rest of the page inert and covers it, so while one
// is open the messages go inside it, where they can be seen and closed
function getHost(): HTMLElement {
  const dialogs: HTMLDialogElement[] = [...document.querySelectorAll('dialog')];
  const modal: HTMLDialogElement | undefined = dialogs.findLast(
    (dialog: HTMLDialogElement): boolean => dialog.matches(':modal'),
  );

  return modal ?? document.body;
}

function placeRegion(): HTMLElement {
  const host: HTMLElement = getHost();
  if (region.parentElement === host) {
    return region;
  }

  host.append(region);
  // When that dialog closes, the messages move back out with it
  if (host instanceof HTMLDialogElement) {
    host.addEventListener('close', placeRegion, { once: true });
  }

  return region;
}

function createMessageElement(message: SnackbarMessage, onClose: () => void): HTMLElement {
  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'snackbar__close',
    attributes: { type: 'button', 'aria-label': FEEDBACK_CONTENT.closeMessageLabel },
    children: [createIcon(IconName.Close)],
  });
  closeButton.addEventListener('click', onClose);

  return createElement('div', {
    className: `snackbar snackbar--${message.variant}`,
    // An error interrupts a screen reader; the other messages wait their turn
    attributes: { role: message.variant === SnackbarVariant.Error ? 'alert' : 'status' },
    children: [
      createIcon(ICONS[message.variant]),
      createElement('p', { className: 'snackbar__text', text: message.text }),
      closeButton,
    ],
  });
}

// Shows a short message at the bottom of the screen that goes away by itself
// and never blocks the page. The same message twice is shown once, with its
// time started again.
export function showSnackbar(message: SnackbarMessage): void {
  const key: string = `${message.variant}:${message.text}`;
  const shown: ShownMessage | undefined = shownMessages.find(
    (candidate: ShownMessage): boolean => candidate.key === key,
  );
  if (shown !== undefined) {
    shown.restartTimer();
    return;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const dismiss = (): void => {
    clearTimeout(timeoutId);
    const index: number = shownMessages.indexOf(entry);
    if (index === -1) {
      return;
    }
    shownMessages.splice(index, 1);
    const fade: Animation = element.animate([{ opacity: 1 }, { opacity: 0 }], LEAVE_DURATION);
    fade.addEventListener('finish', (): void => {
      element.remove();
    });
  };

  const restartTimer = (): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(dismiss, DISPLAY_TIME);
  };

  const stopTimer = (): void => {
    clearTimeout(timeoutId);
  };

  const entry: ShownMessage = { key, restartTimer, dismiss };
  const element: HTMLElement = createMessageElement(message, dismiss);
  element.addEventListener('pointerenter', stopTimer);
  element.addEventListener('pointerleave', restartTimer);
  element.addEventListener('focusin', stopTimer);
  element.addEventListener('focusout', restartTimer);

  shownMessages.push(entry);
  placeRegion().append(element);
  restartTimer();

  while (shownMessages.length > MAX_MESSAGES) {
    shownMessages[0]?.dismiss();
  }
}
