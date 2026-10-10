import { ApiError, isOutcomeUnknown } from '../../api/api-error.ts';
import { postComment } from '../../api/comments-api.ts';
import { COMMENT_MAX_LENGTH, GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { CommentMessages } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { fitToText } from '../../utils/auto-grow.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { getCommentAuthorName, getNameInitial } from '../../utils/profile-name.ts';
import { setButtonBusy } from '../button/button.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';

const INPUT_ID = 'game-details-comment-input';
const ERROR_ID = 'game-details-comment-error';

const MESSAGES: CommentMessages = GAME_DETAILS_CONTENT.commentMessages;

export interface CommentFormOptions {
  // Checks the session before a comment is sent. A guest gets undefined, and
  // the auth dialog in place of Game Details.
  readonly requireSession: (warning: string) => AppSession | undefined;
  // A comment was posted, or may have been: the comments load again
  readonly onSent: () => void;
}

export interface CommentForm {
  readonly element: HTMLFormElement;
  // Empties the form for a game and the current visitor. A guest's form is
  // locked; a signed-in user's avatar shows the initial of the user's name.
  readonly show: (slug: string, session: AppSession | undefined) => void;
}

interface CommentFormState {
  slug: string;
  session: AppSession | undefined;
  isPending: boolean;
  // Whether the form had the focus when it was locked
  hadFocus: boolean;
  // The text of a comment that a sign-in interrupted. It comes back in the
  // form of its game once a user is signed in.
  draft?: { readonly slug: string; readonly text: string };
}

// Whether a text can be sent: not empty and not longer than the API takes,
// both after trimming
function isSendable(text: string): boolean {
  const trimmed: string = text.trim();

  return trimmed !== '' && trimmed.length <= COMMENT_MAX_LENGTH;
}

// The form for a new comment, available only to a signed-in user. The textarea
// grows with its text (see the styles); Enter sends, and Shift+Enter starts a
// new line. While a comment is on its way the form is locked. After a refusal
// of the server the text stays for another try; after an unknown outcome the
// text stays too, the comments load again, and nothing is sent on its own.
export function createCommentForm(options: CommentFormOptions): CommentForm {
  const state: CommentFormState = {
    slug: '',
    session: undefined,
    isPending: false,
    hadFocus: false,
  };

  const avatar: HTMLSpanElement = createElement('span', {
    className: 'game-details__user',
    attributes: { 'aria-hidden': 'true' },
  });

  const label: HTMLLabelElement = createElement('label', {
    className: 'game-details__hidden',
    text: GAME_DETAILS_CONTENT.commentLabel,
    attributes: { for: INPUT_ID },
  });

  const input: HTMLTextAreaElement = createElement('textarea', {
    className: 'game-details__comment-input',
    attributes: { id: INPUT_ID, name: 'comment', rows: '1', 'aria-describedby': ERROR_ID },
  });

  const sendButton: HTMLButtonElement = createElement('button', {
    className: 'game-details__send',
    attributes: { type: 'submit', 'aria-label': GAME_DETAILS_CONTENT.sendLabel },
    children: [createIcon(IconName.Send)],
  });

  const fieldError: HTMLParagraphElement = createElement('p', {
    className: 'game-details__comment-error',
    attributes: { id: ERROR_ID, 'aria-live': 'polite' },
  });

  const element: HTMLFormElement = createElement('form', {
    className: 'game-details__comment-form',
    attributes: { novalidate: '' },
    children: [avatar, label, input, sendButton, fieldError],
  });

  // The send button works only for a text that can be sent, and a text that
  // is too long says so under the field
  const update = (): void => {
    const isTooLong: boolean = input.value.trim().length > COMMENT_MAX_LENGTH;
    fieldError.textContent = isTooLong ? MESSAGES.tooLong : '';
    fieldError.hidden = !isTooLong;
    input.setAttribute('aria-invalid', String(isTooLong));
    sendButton.disabled = input.disabled || !isSendable(input.value);
    fitToText(input);
  };

  // A guest's form stays locked, and so does a form whose comment is on its way
  const lock = (): void => {
    input.disabled = state.isPending || state.session === undefined;
    update();
  };

  const setPending = (isPending: boolean): void => {
    if (isPending) {
      state.hadFocus = element.contains(document.activeElement);
    }
    state.isPending = isPending;
    element.setAttribute('aria-busy', String(isPending));
    setButtonBusy(sendButton, isPending);
    lock();

    // The browser takes the focus away from a locked field. Once the form is
    // free the focus comes back to the textarea, so the user can type on,
    // unless it has moved on to something else in the meantime.
    const isFocusLost: boolean =
      document.activeElement === null || document.activeElement === document.body;
    if (!isPending && isFocusLost && state.hadFocus && !input.disabled) {
      input.focus();
    }
  };

  const send = async (session: AppSession, text: string): Promise<void> => {
    setPending(true);
    try {
      await postComment(state.slug, {
        userEmail: session.email,
        authorName: getCommentAuthorName(session),
        text,
      });
      input.value = '';
      showSnackbar({ variant: SnackbarVariant.Success, text: MESSAGES.posted });
      options.onSent();
    } catch (error: unknown) {
      // A refusal of the server says why, and the text waits for another try.
      // Any other failure may have posted the comment all the same.
      if (error instanceof ApiError && !isOutcomeUnknown(error)) {
        showSnackbar({ variant: SnackbarVariant.Error, text: error.message });
      } else {
        showSnackbar({ variant: SnackbarVariant.Warning, text: MESSAGES.unconfirmed });
        options.onSent();
      }
    } finally {
      setPending(false);
    }
  };

  element.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
    const { slug } = state;
    const text: string = input.value;
    if (state.isPending || !isSendable(text)) {
      return;
    }
    const session: AppSession | undefined = options.requireSession(MESSAGES.loginWarning);
    if (session === undefined) {
      state.draft = { slug, text };
      return;
    }
    void send(session, text.trim());
  });

  input.addEventListener('keydown', (event: KeyboardEvent): void => {
    // Enter sends, unless it starts a new line or ends a word of an input method
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    element.requestSubmit();
  });
  input.addEventListener('input', update);

  const show = (slug: string, session: AppSession | undefined): void => {
    if (state.draft?.slug !== slug) {
      state.draft = undefined;
    }
    state.slug = slug;
    state.session = session;
    input.value = session === undefined ? '' : (state.draft?.text ?? '');
    if (session !== undefined) {
      state.draft = undefined;
    }

    input.placeholder =
      session === undefined
        ? GAME_DETAILS_CONTENT.commentGuestPlaceholder
        : GAME_DETAILS_CONTENT.commentPlaceholder;
    avatar.replaceChildren(
      session === undefined
        ? createIcon(IconName.Person)
        : getNameInitial(getCommentAuthorName(session)),
    );
    lock();
  };

  return { element, show };
}
