import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError, ApiErrorKind } from '../../api/api-error.ts';
import { toggleCommentLike } from '../../api/likes-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { GameComment } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';
import { createLikeButton } from './game-details-like.ts';

vi.mock('../../api/likes-api.ts', () => ({ toggleCommentLike: vi.fn() }));
vi.mock('../snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 10),
};

const COMMENT: GameComment = {
  commentId: 'c1',
  authorName: 'ForestDweller',
  text: 'Lovely',
  likesCount: 12,
  isLikedByCurrentUser: false,
  createdAt: '2026-08-30T07:00:00Z',
};

interface TestButton {
  readonly button: HTMLButtonElement;
  readonly requireSession: Mock<(warning: string) => AppSession | undefined>;
  readonly onUnconfirmed: Mock<() => void>;
}

function renderButton(session: AppSession | undefined, comment: GameComment): TestButton {
  const requireSession: Mock<(warning: string) => AppSession | undefined> = vi
    .fn<(warning: string) => AppSession | undefined>()
    .mockReturnValue(session);
  const onUnconfirmed: Mock<() => void> = vi.fn<() => void>();
  const button: HTMLButtonElement = createLikeButton({ comment, requireSession, onUnconfirmed });

  return { button, requireSession, onUnconfirmed };
}

function getCount(button: HTMLButtonElement): string | undefined {
  return button.lastElementChild?.textContent;
}

// Lets the answer of the mocked request arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
});

describe('like button', (): void => {
  it('starts from the state the server sent for the visitor', (): void => {
    const { button } = renderButton(SESSION, { ...COMMENT, isLikedByCurrentUser: true });

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(getCount(button)).toBe('12');
  });

  it('sends nothing for a guest, who is asked to log in', (): void => {
    const { button, requireSession } = renderButton(undefined, COMMENT);

    button.click();

    expect(requireSession).toHaveBeenCalledExactlyOnceWith(
      GAME_DETAILS_CONTENT.likeMessages.loginWarning,
    );
    expect(toggleCommentLike).not.toHaveBeenCalled();
  });

  it('is locked while the like is on its way and then shows the server state', async (): Promise<void> => {
    vi.mocked(toggleCommentLike).mockResolvedValue({ isLikedByCurrentUser: true, likesCount: 20 });
    const { button } = renderButton(SESSION, COMMENT);

    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    // A second click while waiting sends nothing
    button.dispatchEvent(new MouseEvent('click'));

    await settle();

    expect(toggleCommentLike).toHaveBeenCalledExactlyOnceWith('c1', 'alex@minigames.com');
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    // The count is the server's, not the old one plus one
    expect(getCount(button)).toBe('20');
  });

  it('keeps the state and shows the reason when the server refuses', async (): Promise<void> => {
    vi.mocked(toggleCommentLike).mockRejectedValue(
      new ApiError(ApiErrorKind.RateLimit, 'Rate limit exceeded. Try again in 42 seconds', 429),
    );
    const { button, onUnconfirmed } = renderButton(SESSION, COMMENT);

    button.click();
    await settle();

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(getCount(button)).toBe('12');
    expect(button.disabled).toBe(false);
    expect(onUnconfirmed).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Error,
      text: 'Rate limit exceeded. Try again in 42 seconds',
    });
  });

  it('loads the comments again instead of a second like when no answer came', async (): Promise<void> => {
    vi.mocked(toggleCommentLike).mockRejectedValue(
      new ApiError(ApiErrorKind.Network, 'The server could not be reached.'),
    );
    const { button, onUnconfirmed } = renderButton(SESSION, COMMENT);

    button.click();
    await settle();

    expect(toggleCommentLike).toHaveBeenCalledOnce();
    expect(onUnconfirmed).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: GAME_DETAILS_CONTENT.likeMessages.unconfirmed,
    });
  });
});
