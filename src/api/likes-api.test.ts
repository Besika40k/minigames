import { describe, expect, it, vi, type Mock } from 'vitest';
import { API_BASE_URL } from './api-config.ts';
import { ApiErrorKind } from './api-error.ts';
import { toggleCommentLike } from './likes-api.ts';

type FetchMock = Mock<typeof fetch>;

function stubFetch(body: unknown, status: number = 200): FetchMock {
  const fetchMock: FetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('toggleCommentLike', (): void => {
  it('posts the user to the like of the comment and reads the new state', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch({
      data: { isLikedByCurrentUser: true, likesCount: 13 },
    });

    await expect(toggleCommentLike('7c1e-4b', 'alex@mini.games')).resolves.toEqual({
      isLikedByCurrentUser: true,
      likesCount: 13,
    });

    const [input, init] = fetchMock.mock.calls[0] ?? [];
    expect(input instanceof URL ? input.href : undefined).toBe(
      `${API_BASE_URL}/comments/7c1e-4b/like`,
    );
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"userEmail":"alex@mini.games"}');
  });

  it('fails as an invalid response without the new count', async (): Promise<void> => {
    stubFetch({ data: { isLikedByCurrentUser: false } });

    await expect(toggleCommentLike('7c1e', 'alex@mini.games')).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });

  it('passes a refusal of the server on', async (): Promise<void> => {
    stubFetch({ error: 'Comment not found: 7c1e' }, 404);

    await expect(toggleCommentLike('7c1e', 'alex@mini.games')).rejects.toMatchObject({
      kind: ApiErrorKind.NotFound,
      message: 'Comment not found: 7c1e',
    });
  });
});
