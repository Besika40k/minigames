import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGameComments } from '../../api/comments-api.ts';
import { fetchGameDetails } from '../../api/games-api.ts';
import { fetchOwnGameComments, fetchOwnGameDetails } from '../../api/own-game-store.ts';
import { getOwnGameDetails } from '../../api/own-games.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { UNRATED_TEXT } from '../../data/games.ts';
import { OWN_GAMES } from '../../data/own-games.ts';
import type { OwnGame } from '../../types/game.ts';
import type { GameDetails, GameDetailsDialog } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createGameDetailsDialog } from './game-details-dialog.ts';

vi.mock('../../api/games-api.ts', () => ({ fetchGameDetails: vi.fn() }));
vi.mock('../../api/comments-api.ts', () => ({ fetchGameComments: vi.fn(), postComment: vi.fn() }));
vi.mock('../../api/own-game-store.ts', () => ({
  fetchOwnGameDetails: vi.fn(),
  fetchOwnGameComments: vi.fn(),
}));

const CHESS: GameDetails = {
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

const [ALCHEMIST] = OWN_GAMES as [OwnGame];

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 28),
};

function renderDialog(session?: AppSession): GameDetailsDialog {
  const dialog: GameDetailsDialog = createGameDetailsDialog({
    onClose: vi.fn<() => void>(),
    getSession: vi.fn<() => AppSession | undefined>().mockReturnValue(session),
    requireSession: vi.fn<(warning: string) => AppSession | undefined>(),
  });
  document.body.append(dialog.element);

  return dialog;
}

function getText(selector: string): string | undefined {
  return document.querySelector(selector)?.textContent;
}

function isCommentsHidden(): boolean | undefined {
  return document.querySelector('.game-details__content--bottom')?.hasAttribute('hidden');
}

// Lets the answers of the mocked requests arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
  vi.mocked(fetchGameDetails).mockResolvedValue(CHESS);
  vi.mocked(fetchGameComments).mockResolvedValue({ comments: [], totalComments: 0 });
  // Firestore counts three likes, one of them the signed-in user's
  vi.mocked(fetchOwnGameDetails).mockResolvedValue({
    ...getOwnGameDetails(ALCHEMIST),
    likesCount: 3,
    isLikedByCurrentUser: true,
  });
  vi.mocked(fetchOwnGameComments).mockResolvedValue({ comments: [], totalComments: 0 });
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('game details dialog', (): void => {
  it('loads a game of MiniGames itself from Firestore, with a link to play it', async (): Promise<void> => {
    renderDialog(SESSION).show('alchemists-cauldron');
    await settle();

    expect(fetchOwnGameDetails).toHaveBeenCalledExactlyOnceWith(
      'alchemists-cauldron',
      expect.any(AbortSignal),
      SESSION.email,
    );
    expect(fetchGameDetails).not.toHaveBeenCalled();
    expect(getText('.game-details__title')).toBe("Alchemist's Cauldron");
    expect(getText('.game-details__rating')).toContain(UNRATED_TEXT);
    expect(getText('.game-details__likes')).toContain('3');
    const play: HTMLAnchorElement | null = document.querySelector('a.game-details__play');
    expect(play?.href).toBe(ALCHEMIST.playUrl);
    expect(getText('.game-details__no-records')).toBe(GAME_DETAILS_CONTENT.noRecordsText);
  });

  it('gives a game of MiniGames itself its favorites and comments', async (): Promise<void> => {
    renderDialog(SESSION).show('alchemists-cauldron');
    await settle();

    expect(getText('.game-details__favorite')).toBe(GAME_DETAILS_CONTENT.removeFavoriteLabel);
    expect(isCommentsHidden()).toBe(false);
    expect(fetchOwnGameComments).toHaveBeenCalledExactlyOnceWith(
      'alchemists-cauldron',
      expect.any(AbortSignal),
      SESSION.email,
    );
    expect(fetchGameComments).not.toHaveBeenCalled();
  });

  it('loads any other game and its comments from the API', async (): Promise<void> => {
    const dialog: GameDetailsDialog = renderDialog();
    dialog.show('alchemists-cauldron');
    await settle();
    vi.clearAllMocks();

    dialog.show('chess');
    await settle();

    expect(fetchGameDetails).toHaveBeenCalledExactlyOnceWith(
      'chess',
      expect.any(AbortSignal),
      undefined,
    );
    expect(fetchOwnGameDetails).not.toHaveBeenCalled();
    expect(getText('.game-details__title')).toBe('Chess');
    expect(document.querySelector('button.game-details__play')).not.toBeNull();
    expect(getText('.game-details__favorite')).toBe(GAME_DETAILS_CONTENT.addFavoriteLabel);
    expect(fetchGameComments).toHaveBeenCalledOnce();
  });
});
