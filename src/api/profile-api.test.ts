import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Game } from '../types/game.ts';
import type { GameDetails } from '../types/game-details.ts';
import { fetchAllGames, fetchGameDetails } from './games-api.ts';
import { listOwnGameFavorites } from './own-game-store.ts';
import { fetchFavoriteGames, fetchUserProfile, saveUserProfile } from './profile-api.ts';
import {
  fetchUserProfile as fetchStoredProfile,
  saveUserProfile as saveStoredProfile,
} from './profile-store.ts';

vi.mock('./games-api.ts', () => ({ fetchAllGames: vi.fn(), fetchGameDetails: vi.fn() }));
vi.mock('./own-game-store.ts', () => ({ listOwnGameFavorites: vi.fn() }));
vi.mock('./profile-store.ts', () => ({ fetchUserProfile: vi.fn(), saveUserProfile: vi.fn() }));

const EMAIL = 'alex@minigames.com';
const SIGNAL: AbortSignal = new AbortController().signal;

function createGame(slug: string): Game {
  return {
    slug,
    name: slug,
    category: 'puzzle',
    price: 'Free',
    shortDescription: 'Short.',
    rating: 4.5,
    likesCount: 10,
    cardImage: `/${slug}.jpg`,
  };
}

// The details of a game, a favorite of the user or not
function createDetails(slug: string, isFavorite: boolean): GameDetails {
  return {
    slug,
    name: slug,
    heroImage: `/${slug}-hero.jpg`,
    rating: 4.5,
    likesCount: 10,
    isLikedByCurrentUser: isFavorite,
    fullDescription: 'Long.',
    specs: { genre: 'Puzzle', players: 'Solo', duration: '5 min', price: 'Free' },
    topRecords: [],
  };
}

beforeEach((): void => {
  vi.clearAllMocks();
});

describe('fetchFavoriteGames', (): void => {
  it('gives the own favorites first, then the API games whose details say so', async (): Promise<void> => {
    vi.mocked(listOwnGameFavorites).mockResolvedValue(['alchemists-cauldron']);
    vi.mocked(fetchAllGames).mockResolvedValue([createGame('chess'), createGame('palia')]);
    vi.mocked(fetchGameDetails).mockImplementation((slug: string): Promise<GameDetails> =>
      Promise.resolve(createDetails(slug, slug === 'palia')),
    );

    const games: readonly Game[] = await fetchFavoriteGames(EMAIL, SIGNAL);

    expect(games.map((game: Game): string => game.slug)).toEqual(['alchemists-cauldron', 'palia']);
    expect(fetchGameDetails).toHaveBeenCalledWith('chess', SIGNAL, EMAIL);
    expect(fetchGameDetails).toHaveBeenCalledWith('palia', SIGNAL, EMAIL);
  });
});

describe('the profile of the user', (): void => {
  it('loads and saves through the Firestore store', async (): Promise<void> => {
    vi.mocked(fetchStoredProfile).mockResolvedValue({ bio: 'Hi' });

    await expect(fetchUserProfile(EMAIL)).resolves.toEqual({ bio: 'Hi' });
    await saveUserProfile(EMAIL, { bio: 'Hello' });

    expect(saveStoredProfile).toHaveBeenCalledExactlyOnceWith(EMAIL, { bio: 'Hello' });
  });
});
