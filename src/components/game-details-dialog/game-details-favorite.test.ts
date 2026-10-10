import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError, ApiErrorKind } from '../../api/api-error.ts';
import { toggleFavorite } from '../../api/favorites-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { GameDetails } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';
import { createFavoriteButton } from './game-details-favorite.ts';

vi.mock('../../api/favorites-api.ts', () => ({ toggleFavorite: vi.fn() }));
vi.mock('../snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 10),
};

const GAME: GameDetails = {
  slug: 'chess',
  name: 'Chess',
  heroImage: '/chess.jpg',
  rating: 4.8,
  likesCount: 1200,
  isLikedByCurrentUser: false,
  fullDescription: 'The classic.',
  specs: { genre: 'Strategy', players: 'Two', duration: '30 min', price: 'Free' },
  topRecords: [],
};

interface TestButton {
  readonly button: HTMLButtonElement;
  readonly requireSession: Mock<(warning: string) => AppSession | undefined>;
  readonly onLikesChange: Mock<(likesCount: number) => void>;
  readonly onUnconfirmed: Mock<() => void>;
}

function renderButton(session: AppSession | undefined, game: GameDetails = GAME): TestButton {
  const requireSession: Mock<(warning: string) => AppSession | undefined> = vi
    .fn<(warning: string) => AppSession | undefined>()
    .mockReturnValue(session);
  const onLikesChange: Mock<(likesCount: number) => void> = vi.fn<(likesCount: number) => void>();
  const onUnconfirmed: Mock<() => void> = vi.fn<() => void>();
  const button: HTMLButtonElement = createFavoriteButton({
    game,
    requireSession,
    onLikesChange,
    onUnconfirmed,
  });

  return { button, requireSession, onLikesChange, onUnconfirmed };
}

function isActive(button: HTMLButtonElement): boolean {
  return button.classList.contains('game-details__favorite--active');
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

describe('favorite button', (): void => {
  it('starts from the favorite state the server sent for the user', (): void => {
    const { button } = renderButton(SESSION, { ...GAME, isLikedByCurrentUser: true });

    expect(isActive(button)).toBe(true);
    expect(button.textContent).toBe(GAME_DETAILS_CONTENT.removeFavoriteLabel);
  });

  it('sends nothing for a guest, who is asked to log in', (): void => {
    const { button, requireSession } = renderButton(undefined);

    button.click();

    expect(requireSession).toHaveBeenCalledExactlyOnceWith(
      GAME_DETAILS_CONTENT.favoriteMessages.loginWarning,
    );
    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(isActive(button)).toBe(false);
  });

  it('is locked while the toggle is on its way and then shows the server state', async (): Promise<void> => {
    vi.mocked(toggleFavorite).mockResolvedValue({ isFavorited: true, likesCount: 1201 });
    const { button, onLikesChange } = renderButton(SESSION);

    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    // Nothing changes before the server confirms it
    expect(isActive(button)).toBe(false);

    await settle();

    expect(toggleFavorite).toHaveBeenCalledExactlyOnceWith('chess', 'alex@minigames.com');
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('false');
    expect(isActive(button)).toBe(true);
    expect(button.textContent).toBe(GAME_DETAILS_CONTENT.removeFavoriteLabel);
    expect(onLikesChange).toHaveBeenCalledExactlyOnceWith(1201);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Success,
      text: GAME_DETAILS_CONTENT.favoriteMessages.added,
    });
  });

  it('follows the server when it removes the favorite', async (): Promise<void> => {
    vi.mocked(toggleFavorite).mockResolvedValue({ isFavorited: false, likesCount: 1199 });
    const { button } = renderButton(SESSION, { ...GAME, isLikedByCurrentUser: true });

    button.click();
    await settle();

    expect(isActive(button)).toBe(false);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Success,
      text: GAME_DETAILS_CONTENT.favoriteMessages.removed,
    });
  });

  it('sends one toggle however often it is clicked while waiting', async (): Promise<void> => {
    vi.mocked(toggleFavorite).mockResolvedValue({ isFavorited: true, likesCount: 1201 });
    const { button } = renderButton(SESSION);

    button.click();
    button.click();
    button.dispatchEvent(new MouseEvent('click'));
    await settle();

    expect(toggleFavorite).toHaveBeenCalledOnce();
  });

  it('keeps the state and shows the reason when the server refuses', async (): Promise<void> => {
    vi.mocked(toggleFavorite).mockRejectedValue(
      new ApiError(ApiErrorKind.RateLimit, 'Rate limit exceeded. Try again in 42 seconds', 429),
    );
    const { button, onUnconfirmed } = renderButton(SESSION);

    button.click();
    await settle();

    expect(isActive(button)).toBe(false);
    expect(button.disabled).toBe(false);
    expect(onUnconfirmed).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Error,
      text: 'Rate limit exceeded. Try again in 42 seconds',
    });
  });

  it('loads the game again instead of a second toggle when no answer came', async (): Promise<void> => {
    vi.mocked(toggleFavorite).mockRejectedValue(
      new ApiError(ApiErrorKind.Network, 'The server could not be reached.'),
    );
    const { button, onUnconfirmed } = renderButton(SESSION);

    button.click();
    await settle();

    expect(toggleFavorite).toHaveBeenCalledOnce();
    expect(onUnconfirmed).toHaveBeenCalledOnce();
    expect(isActive(button)).toBe(false);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: GAME_DETAILS_CONTENT.favoriteMessages.unconfirmed,
    });
  });
});
