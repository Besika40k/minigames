import { API_BASE_URL, REQUEST_TIMEOUT } from './api-config.ts';
import { ApiError, ApiErrorKind, getErrorKind } from './api-error.ts';
import { isRecord, isString } from './guards.ts';

export type QueryParameters = Readonly<Record<string, string>>;

// Sends the request. A cancel by the caller passes the browser's AbortError
// on, so callers can tell it apart; any other failure means no answer.
async function send(url: URL, signal: AbortSignal): Promise<Response> {
  try {
    return await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT)]),
    });
  } catch (error: unknown) {
    if (signal.aborted) {
      throw error;
    }
    throw new ApiError(ApiErrorKind.Network, 'The server could not be reached.');
  }
}

// The JSON of an answer, or undefined when the answer is not JSON
async function readJson(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    return undefined;
  }
}

// An error answer says what went wrong as { "error": "..." }
function getErrorMessage(body: unknown, status: number): string {
  const message: unknown = isRecord(body) ? body.error : undefined;

  return isString(message) ? message : `The server answered with status ${String(status)}.`;
}

// Sends a GET request to the API and returns the JSON of its answer. Every
// failure is an ApiError, except a cancel by the caller (see `send`).
export async function getJson(
  path: string,
  parameters: QueryParameters,
  signal: AbortSignal,
): Promise<unknown> {
  const url: URL = new URL(`${API_BASE_URL}${path}`);
  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, value);
  }

  const response: Response = await send(url, signal);
  const body: unknown = await readJson(response);
  if (!response.ok) {
    const kind: ApiErrorKind = getErrorKind(response.status);
    throw new ApiError(kind, getErrorMessage(body, response.status), response.status);
  }
  if (body === undefined) {
    throw new ApiError(ApiErrorKind.InvalidResponse, 'The answer is not JSON.', response.status);
  }

  return body;
}
