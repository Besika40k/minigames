import { describe, expect, it, vi, type Mock } from 'vitest';
import type { GameComment, GameCommentsPage } from '../types/game-details.ts';
import { API_BASE_URL } from './api-config.ts';
import { ApiErrorKind } from './api-error.ts';
import { fetchGameComments, postComment } from './comments-api.ts';

type FetchMock = Mock<typeof fetch>;

// A comment as the API sends it
const COMMENT: GameComment = {
  commentId: '7c1e',
  authorName: 'ForestDweller',
  text: 'Such a calming little game!',
  likesCount: 12,
  isLikedByCurrentUser: true,
  createdAt: '2026-08-30T07:00:00Z',
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

describe('fetchGameComments', (): void => {
  it('asks a guest for the three newest comments and the total', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({ data: [COMMENT], meta: { totalComments: 8 } });

    const page: GameCommentsPage = await fetchGameComments('chess', new AbortController().signal);

    expect(getRequestedUrl(fetchMock)).toBe(
      `${API_BASE_URL}/games/chess/comments?limit=3&sort=newest`,
    );
    expect(page).toEqual({ comments: [COMMENT], totalComments: 8 });
  });

  it('names the signed-in user, encoded', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({ data: [], meta: { totalComments: 0 } });

    await fetchGameComments('chess', new AbortController().signal, 'alex+qa@mini.games');

    expect(getRequestedUrl(fetchMock)).toBe(
      `${API_BASE_URL}/games/chess/comments?limit=3&sort=newest&userEmail=alex%2Bqa%40mini.games`,
    );
  });

  it('fails as an invalid response without the total', async (): Promise<void> => {
    stubFetch({ data: [COMMENT], meta: {} });

    await expect(fetchGameComments('chess', new AbortController().signal)).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });
});

describe('postComment', (): void => {
  it('posts the comment of the user and reads the created one', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({ data: COMMENT }, 201);

    const created: GameComment = await postComment('chess', {
      userEmail: 'alex@mini.games',
      authorName: 'ForestDweller',
      text: 'Such a calming little game!',
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(getRequestedUrl(fetchMock)).toBe(`${API_BASE_URL}/games/chess/comments`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(
      JSON.stringify({
        userEmail: 'alex@mini.games',
        authorName: 'ForestDweller',
        text: 'Such a calming little game!',
      }),
    );
    expect(created).toEqual(COMMENT);
  });

  it('passes a refusal of the server on', async (): Promise<void> => {
    stubFetch({ error: 'text must be 1-500 characters' }, 400);

    await expect(
      postComment('chess', { userEmail: 'a@b.co', authorName: 'Al', text: ' ' }),
    ).rejects.toMatchObject({
      kind: ApiErrorKind.BadRequest,
      message: 'text must be 1-500 characters',
    });
  });
});
