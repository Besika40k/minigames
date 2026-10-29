import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OWN_GAMES } from '../data/own-games.ts';
import type { OwnGame } from '../types/game.ts';
import type { NewComment } from '../types/game-details.ts';
import { postComment } from './comments-api.ts';
import { getGameBackend, loadOwnGames } from './game-backend.ts';
import { toggleCommentLike } from './likes-api.ts';
import {
  countOwnGameLikes,
  postOwnGameComment,
  toggleOwnGameCommentLike,
  toggleOwnGameFavorite,
} from './own-game-store.ts';

vi.mock('./comments-api.ts', () => ({ fetchGameComments: vi.fn(), postComment: vi.fn() }));
vi.mock('./favorites-api.ts', () => ({ toggleFavorite: vi.fn() }));
vi.mock('./games-api.ts', () => ({ fetchGameDetails: vi.fn() }));
vi.mock('./likes-api.ts', () => ({ toggleCommentLike: vi.fn() }));
vi.mock('./own-game-store.ts', () => ({
  countOwnGameLikes: vi.fn(),
  postOwnGameComment: vi.fn(),
  toggleOwnGameCommentLike: vi.fn(),
  toggleOwnGameFavorite: vi.fn(),
}));

const EMAIL = 'alex@minigames.com';
const COMMENT: NewComment = { userEmail: EMAIL, authorName: 'Alex Pro', text: 'Fun' };

beforeEach((): void => {
  vi.clearAllMocks();
});

describe('getGameBackend', (): void => {
  it('sends the changes of an API game to the API, a comment like by its id alone', async (): Promise<void> => {
    await getGameBackend('palia').postComment('palia', COMMENT);
    await getGameBackend('palia').toggleCommentLike('palia', 'c1', EMAIL);

    expect(postComment).toHaveBeenCalledExactlyOnceWith('palia', COMMENT);
    expect(toggleCommentLike).toHaveBeenCalledExactlyOnceWith('c1', EMAIL);
    expect(postOwnGameComment).not.toHaveBeenCalled();
  });

  it('sends the changes of a game of MiniGames itself to Firestore', async (): Promise<void> => {
    const slug = 'alchemists-cauldron';
    await getGameBackend(slug).toggleFavorite(slug, EMAIL);
    await getGameBackend(slug).postComment(slug, COMMENT);
    await getGameBackend(slug).toggleCommentLike(slug, 'c1', EMAIL);

    expect(toggleOwnGameFavorite).toHaveBeenCalledExactlyOnceWith(slug, EMAIL);
    expect(postOwnGameComment).toHaveBeenCalledExactlyOnceWith(slug, COMMENT);
    expect(toggleOwnGameCommentLike).toHaveBeenCalledExactlyOnceWith(slug, 'c1', EMAIL);
    expect(postComment).not.toHaveBeenCalled();
  });
});

describe('loadOwnGames', (): void => {
  it('gives the own games with the likes Firestore counts', async (): Promise<void> => {
    vi.mocked(countOwnGameLikes).mockResolvedValue(9);

    const games: readonly OwnGame[] = await loadOwnGames();

    expect(games.map((game: OwnGame): number => game.likesCount)).toEqual(
      OWN_GAMES.map((): number => 9),
    );
  });

  it('keeps the likes of the data when Firestore cannot count them', async (): Promise<void> => {
    vi.mocked(countOwnGameLikes).mockRejectedValue(new Error('offline'));

    await expect(loadOwnGames()).resolves.toBe(OWN_GAMES);
  });
});
