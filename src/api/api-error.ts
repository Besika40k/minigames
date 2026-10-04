export enum ApiErrorKind {
  // No answer: the browser is offline, or the server is unreachable or too slow
  Network = 'network',
  // The server rejected a parameter (400)
  BadRequest = 'bad-request',
  // The game does not exist (404)
  NotFound = 'not-found',
  // Too many requests in a short time (429)
  RateLimit = 'rate-limit',
  // The server failed, or answered with another unexpected status
  Server = 'server',
  // The answer does not have the shape the API describes
  InvalidResponse = 'invalid-response',
}

const KINDS_BY_STATUS: ReadonlyMap<number, ApiErrorKind> = new Map([
  [400, ApiErrorKind.BadRequest],
  [404, ApiErrorKind.NotFound],
  [429, ApiErrorKind.RateLimit],
]);

// A failed request. The message is fit to show: for an error answer it is
// the server's own text, such as "Rate limit exceeded. Try again in 42 seconds".
export class ApiError extends Error {
  public readonly kind: ApiErrorKind;
  // The HTTP status, when the server answered at all
  public readonly status: number | undefined;

  public constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function getErrorKind(status: number): ApiErrorKind {
  return KINDS_BY_STATUS.get(status) ?? ApiErrorKind.Server;
}
