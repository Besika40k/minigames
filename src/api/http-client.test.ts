import { describe, expect, it, vi, type Mock } from 'vitest';
import { API_BASE_URL } from './api-config.ts';
import { ApiError, ApiErrorKind } from './api-error.ts';
import { getJson } from './http-client.ts';

type FetchMock = Mock<typeof fetch>;

function stubFetch(response: Response): FetchMock {
  const fetchMock: FetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function jsonResponse(body: unknown, status: number = 200): Response {
  return Response.json(body, { status });
}

// The URL and the signal fetch got in its first call
function getFetchCall(fetchMock: FetchMock): {
  url: string | undefined;
  signal: AbortSignal | undefined;
} {
  const [input, init] = fetchMock.mock.calls[0] ?? [];

  return { url: input instanceof URL ? input.href : undefined, signal: init?.signal ?? undefined };
}

async function getError(request: Promise<unknown>): Promise<unknown> {
  try {
    await request;
  } catch (error: unknown) {
    return error;
  }

  throw new Error('The request did not fail.');
}

describe('getJson', (): void => {
  it('requests the path under the API base with the query parameters', async (): Promise<void> => {
    const fetchMock: FetchMock = stubFetch(jsonResponse({ data: [] }));

    await getJson('/games', { page: '2', search: 'two words' }, new AbortController().signal);

    expect(getFetchCall(fetchMock).url).toBe(`${API_BASE_URL}/games?page=2&search=two+words`);
  });

  it('returns the JSON of a successful answer', async (): Promise<void> => {
    stubFetch(jsonResponse({ data: { slug: 'chess' } }));

    await expect(getJson('/games/chess', {}, new AbortController().signal)).resolves.toEqual({
      data: { slug: 'chess' },
    });
  });

  it('turns an error answer into an ApiError with the server message', async (): Promise<void> => {
    stubFetch(jsonResponse({ error: 'Rate limit exceeded. Try again in 42 seconds' }, 429));

    const error: unknown = await getError(getJson('/games', {}, new AbortController().signal));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: ApiErrorKind.RateLimit,
      status: 429,
      message: 'Rate limit exceeded. Try again in 42 seconds',
    });
  });

  it('describes an error answer without a message by its status', async (): Promise<void> => {
    stubFetch(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(getJson('/games', {}, new AbortController().signal)).rejects.toMatchObject({
      kind: ApiErrorKind.Server,
      status: 502,
      message: 'The server answered with status 502.',
    });
  });

  it('fails as an invalid response when a successful answer is not JSON', async (): Promise<void> => {
    stubFetch(new Response('not json', { status: 200 }));

    await expect(getJson('/games', {}, new AbortController().signal)).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });

  it('fails as a network error when no answer arrives', async (): Promise<void> => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')));

    await expect(getJson('/games', {}, new AbortController().signal)).rejects.toMatchObject({
      kind: ApiErrorKind.Network,
    });
  });

  it('passes the caller cancel on as it is, not as an ApiError', async (): Promise<void> => {
    const controller: AbortController = new AbortController();
    const abortError: DOMException = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((): Promise<Response> => {
        controller.abort();
        return Promise.reject(abortError);
      }),
    );

    await expect(getJson('/games', {}, controller.signal)).rejects.toBe(abortError);
  });

  it('cancels the request when the caller cancels', async (): Promise<void> => {
    const controller: AbortController = new AbortController();
    const fetchMock: FetchMock = stubFetch(jsonResponse({ data: [] }));

    await getJson('/games', {}, controller.signal);
    const { signal } = getFetchCall(fetchMock);
    controller.abort();

    expect(signal?.aborted).toBe(true);
  });
});
