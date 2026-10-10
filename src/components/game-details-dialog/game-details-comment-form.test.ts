import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError, ApiErrorKind } from '../../api/api-error.ts';
import { postComment } from '../../api/comments-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { GameComment } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';
import { createCommentForm, type CommentForm } from './game-details-comment-form.ts';

vi.mock('../../api/comments-api.ts', () => ({ postComment: vi.fn() }));
vi.mock('../snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

const SESSION: AppSession = {
  displayName: '  élodie Martin',
  email: 'elodie@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 10),
};

const CREATED: GameComment = {
  commentId: 'c1',
  authorName: 'élodie Martin',
  text: 'Such a calming little game!',
  likesCount: 0,
  isLikedByCurrentUser: false,
  createdAt: '2026-10-10T09:00:00Z',
};

interface TestForm {
  readonly form: CommentForm;
  readonly input: HTMLTextAreaElement;
  readonly sendButton: HTMLButtonElement;
  readonly requireSession: Mock<(warning: string) => AppSession | undefined>;
  readonly onSent: Mock<() => void>;
}

function renderForm(session: AppSession | undefined): TestForm {
  const requireSession: Mock<(warning: string) => AppSession | undefined> = vi
    .fn<(warning: string) => AppSession | undefined>()
    .mockReturnValue(session);
  const onSent: Mock<() => void> = vi.fn<() => void>();
  const form: CommentForm = createCommentForm({ requireSession, onSent });
  document.body.append(form.element);
  form.show('chess', session);

  const input: HTMLTextAreaElement | null = form.element.querySelector('textarea');
  const sendButton: HTMLButtonElement | null = form.element.querySelector('button');
  if (input === null || sendButton === null) {
    throw new Error('The form has no textarea or send button.');
  }

  return { form, input, sendButton, requireSession, onSent };
}

function typeText(input: HTMLTextAreaElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

function pressEnter(input: HTMLTextAreaElement, isShift: boolean = false): KeyboardEvent {
  const event: KeyboardEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    shiftKey: isShift,
    cancelable: true,
  });
  input.dispatchEvent(event);

  return event;
}

// Lets the answer of the mocked request arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
  vi.mocked(postComment).mockResolvedValue(CREATED);
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('comment form for a guest', (): void => {
  it('is locked and says why', (): void => {
    const { form, input, sendButton } = renderForm(undefined);

    expect(input.disabled).toBe(true);
    expect(input.placeholder).toBe(GAME_DETAILS_CONTENT.commentGuestPlaceholder);
    expect(sendButton.disabled).toBe(true);
    // A generic person in place of an initial
    expect(form.element.querySelector(':scope .game-details__user svg')).not.toBeNull();
  });
});

describe('comment form for a signed-in user', (): void => {
  it('starts empty, with the initial of the user in the avatar', (): void => {
    const { form, input, sendButton } = renderForm(SESSION);

    expect(input.disabled).toBe(false);
    expect(input.value).toBe('');
    expect(input.placeholder).toBe(GAME_DETAILS_CONTENT.commentPlaceholder);
    expect(sendButton.disabled).toBe(true);
    expect(form.element.querySelector('.game-details__user')?.textContent).toBe('É');
  });

  it('sends the trimmed text with Enter, and Shift+Enter only starts a line', (): void => {
    const { input } = renderForm(SESSION);
    typeText(input, '  Such a calming little game!\n');

    expect(pressEnter(input, true).defaultPrevented).toBe(false);
    expect(postComment).not.toHaveBeenCalled();

    expect(pressEnter(input).defaultPrevented).toBe(true);
    expect(postComment).toHaveBeenCalledExactlyOnceWith('chess', {
      userEmail: 'elodie@minigames.com',
      authorName: 'élodie Martin',
      text: 'Such a calming little game!',
    });
  });

  it('sends nothing empty or longer than 500 characters', (): void => {
    const { form, input, sendButton } = renderForm(SESSION);
    const error: HTMLElement | null = form.element.querySelector('.game-details__comment-error');

    typeText(input, ' \n ');
    pressEnter(input);
    expect(sendButton.disabled).toBe(true);
    expect(error?.hidden).toBe(true);

    typeText(input, ` ${'x'.repeat(500)} `);
    expect(sendButton.disabled).toBe(false);

    typeText(input, 'x'.repeat(501));
    pressEnter(input);
    expect(sendButton.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(error?.hidden).toBe(false);
    expect(error?.textContent).toBe(GAME_DETAILS_CONTENT.commentMessages.tooLong);
    expect(postComment).not.toHaveBeenCalled();
  });

  it('is locked while the comment is on its way, then empty with the list loaded again', async (): Promise<void> => {
    const { input, sendButton, onSent } = renderForm(SESSION);
    typeText(input, 'Lovely');

    sendButton.click();
    expect(input.disabled).toBe(true);
    expect(sendButton.getAttribute('aria-busy')).toBe('true');
    // A second send while waiting does nothing
    pressEnter(input);

    await settle();

    expect(postComment).toHaveBeenCalledOnce();
    expect(input.disabled).toBe(false);
    expect(input.value).toBe('');
    expect(sendButton.disabled).toBe(true);
    expect(onSent).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Success,
      text: GAME_DETAILS_CONTENT.commentMessages.posted,
    });
  });

  it('keeps the text for another try when the server refuses it', async (): Promise<void> => {
    vi.mocked(postComment).mockRejectedValue(
      new ApiError(ApiErrorKind.BadRequest, 'text must be 1-500 characters', 400),
    );
    const { input, onSent } = renderForm(SESSION);
    typeText(input, 'Lovely');

    pressEnter(input);
    await settle();

    expect(input.value).toBe('Lovely');
    expect(input.disabled).toBe(false);
    expect(onSent).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Error,
      text: 'text must be 1-500 characters',
    });
  });

  it('keeps the text, loads the list and sends nothing again when no answer came', async (): Promise<void> => {
    vi.mocked(postComment).mockRejectedValue(
      new ApiError(ApiErrorKind.Network, 'The server could not be reached.'),
    );
    const { input, onSent } = renderForm(SESSION);
    typeText(input, 'Lovely');

    pressEnter(input);
    await settle();

    expect(postComment).toHaveBeenCalledOnce();
    expect(input.value).toBe('Lovely');
    expect(onSent).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: GAME_DETAILS_CONTENT.commentMessages.unconfirmed,
    });
  });

  it('empties the form when a game opens', (): void => {
    const { form, input } = renderForm(SESSION);
    typeText(input, 'Half a thought');

    form.show('chess', SESSION);

    expect(input.value).toBe('');
  });
});

describe('comment form after a sign-in', (): void => {
  it('brings back the text a sign-in interrupted, in its own game only', (): void => {
    const { form, input, requireSession } = renderForm(SESSION);
    // The session has ended by the time the comment is sent
    requireSession.mockReturnValue(undefined);
    typeText(input, 'Draft');

    pressEnter(input);
    expect(requireSession).toHaveBeenCalledWith(GAME_DETAILS_CONTENT.commentMessages.loginWarning);
    expect(postComment).not.toHaveBeenCalled();

    // A guest closed the auth dialog: the text waits, the form stays locked
    form.show('chess', undefined);
    expect(input.value).toBe('');

    form.show('chess', SESSION);
    expect(input.value).toBe('Draft');

    form.show('tetris', SESSION);
    form.show('chess', SESSION);
    expect(input.value).toBe('');
  });
});
