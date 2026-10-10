import { describe, expect, it } from 'vitest';
import { ApiError, ApiErrorKind, getErrorKind, isOutcomeUnknown } from './api-error.ts';

describe('getErrorKind', (): void => {
  it('names the statuses the API documents', (): void => {
    expect(getErrorKind(400)).toBe(ApiErrorKind.BadRequest);
    expect(getErrorKind(401)).toBe(ApiErrorKind.Unauthorized);
    expect(getErrorKind(404)).toBe(ApiErrorKind.NotFound);
    expect(getErrorKind(429)).toBe(ApiErrorKind.RateLimit);
  });

  it('treats any other status as a server failure', (): void => {
    expect(getErrorKind(500)).toBe(ApiErrorKind.Server);
    expect(getErrorKind(503)).toBe(ApiErrorKind.Server);
    expect(getErrorKind(403)).toBe(ApiErrorKind.Server);
  });
});

describe('ApiError', (): void => {
  it('keeps the kind, the message to show and the status', (): void => {
    const error: ApiError = new ApiError(ApiErrorKind.RateLimit, 'Rate limit exceeded.', 429);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.kind).toBe(ApiErrorKind.RateLimit);
    expect(error.message).toBe('Rate limit exceeded.');
    expect(error.status).toBe(429);
  });

  it('has no status when the server did not answer', (): void => {
    expect(new ApiError(ApiErrorKind.Network, 'No connection.').status).toBeUndefined();
  });
});

describe('isOutcomeUnknown', (): void => {
  it('is sure that nothing changed when the server refused', (): void => {
    for (const kind of [
      ApiErrorKind.BadRequest,
      ApiErrorKind.Unauthorized,
      ApiErrorKind.NotFound,
      ApiErrorKind.RateLimit,
    ]) {
      expect(isOutcomeUnknown(new ApiError(kind, 'Refused.'))).toBe(false);
    }
  });

  it('cannot tell after no answer, a server failure or an unreadable answer', (): void => {
    for (const kind of [ApiErrorKind.Network, ApiErrorKind.Server, ApiErrorKind.InvalidResponse]) {
      expect(isOutcomeUnknown(new ApiError(kind, 'Unknown.'))).toBe(true);
    }
    expect(isOutcomeUnknown(new TypeError('A bug on the way'))).toBe(true);
  });
});
