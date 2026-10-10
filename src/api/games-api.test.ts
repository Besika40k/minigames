import { describe, expect, it, vi, type Mock } from 'vitest';
import type { GameDetails } from '../types/game-details.ts';
import { API_BASE_URL } from './api-config.ts';
import { ApiErrorKind } from './api-error.ts';
import { fetchGameDetails } from './games-api.ts';

type FetchMock = Mock<typeof fetch>;

// A game as GET /api/games/{slug} sends it
const DETAILS_DATA = {
  slug: 'chess',
  name: 'Chess',
  heroImage: '/assets/images/games/chess-hero.jpg',
  rating: 4.8,
  likesCount: 1200,
  isLikedByCurrentUser: true,
  fullDescription: 'The classic.',
  specs: { genre: 'Strategy', players: 'Two', duration: '30 min', price: 'Free' },
  topRecords: [
    { position: 1, playerName: 'Magnus', score: 2882, achievedAt: '2026-08-28T14:30:00Z' },
  ],
};

function stubFetch(body: unknown, status: number = 200): FetchMock {
  const fetchMock: FetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function getRequestedUrl(fetchMock: FetchMock): string | undefined {
  const input: unknown = fetchMock.mock.calls[0]?.[0];

  return input instanceof URL ? input.href : undefined;
}

describe('fetchGameDetails', (): void => {
  it('asks for the game of a guest without naming a user', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({
      data: { ...DETAILS_DATA, isLikedByCurrentUser: false },
    });

    const game: GameDetails = await fetchGameDetails('chess', new AbortController().signal);

    expect(getRequestedUrl(fetchMock)).toBe(`${API_BASE_URL}/games/chess`);
    expect(game.isLikedByCurrentUser).toBe(false);
  });

  it('names the signed-in user, encoded, and reads the favorite', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({ data: DETAILS_DATA });

    const game: GameDetails = await fetchGameDetails(
      'chess',
      new AbortController().signal,
      'alex+test@mini.games',
    );

    expect(getRequestedUrl(fetchMock)).toBe(
      `${API_BASE_URL}/games/chess?userEmail=alex%2Btest%40mini.games`,
    );
    expect(game).toMatchObject({
      slug: 'chess',
      likesCount: 1200,
      isLikedByCurrentUser: true,
      heroImage: '/assets/images/games/chess-hero.jpg',
    });
  });

  it('fails as an invalid response without the favorite field', async (): Promise<void> => {
    const entries: [string, unknown][] = Object.entries(DETAILS_DATA).filter(
      ([name]: [string, unknown]): boolean => name !== 'isLikedByCurrentUser',
    );
    stubFetch({ data: Object.fromEntries(entries) });

    await expect(fetchGameDetails('chess', new AbortController().signal)).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });
});
