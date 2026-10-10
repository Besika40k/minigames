import { describe, expect, it, vi, type Mock } from 'vitest';
import { API_BASE_URL } from './api-config.ts';
import { ApiErrorKind } from './api-error.ts';
import { toggleFavorite } from './favorites-api.ts';

type FetchMock = Mock<typeof fetch>;

function stubFetch(body: unknown, status: number = 200): FetchMock {
  const fetchMock: FetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('toggleFavorite', (): void => {
  it('posts the user to the favorite of the game and reads the new state', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({
      data: { gameSlug: 'tiny glade', isFavorited: true, likesCount: 31_201 },
    });

    await expect(toggleFavorite('tiny glade', 'alex@mini.games')).resolves.toEqual({
      isFavorited: true,
      likesCount: 31_201,
    });

    const [input, init] = fetchMock.mock.calls[0] ?? [];
    expect(input instanceof URL ? input.href : undefined).toBe(
      `${API_BASE_URL}/games/tiny%20glade/favorite`,
    );
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"userEmail":"alex@mini.games"}');
  });

  it('fails as an invalid response when the state is missing', async (): Promise<void> => {
    stubFetch({ data: { gameSlug: 'chess', likesCount: 3 } });

    await expect(toggleFavorite('chess', 'alex@mini.games')).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });

  it('passes a refusal of the server on', async (): Promise<void> => {
    stubFetch({ error: 'Game not found: chess' }, 404);

    await expect(toggleFavorite('chess', 'alex@mini.games')).rejects.toMatchObject({
      kind: ApiErrorKind.NotFound,
      message: 'Game not found: chess',
    });
  });
});
