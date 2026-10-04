import { ApiError, ApiErrorKind } from './api-error.ts';
import { isRecord } from './guards.ts';

// An answer that does not have the shape the API describes
export function createInvalidResponseError(): ApiError {
  return new ApiError(ApiErrorKind.InvalidResponse, 'The server sent data the app cannot read.');
}

// The `data` of an answer. A collection is { data: [...], meta: {...} } and a
// single item is { data: {...} }.
export function readData(body: unknown): unknown {
  if (!isRecord(body)) {
    throw createInvalidResponseError();
  }

  return body.data;
}

// The items of a collection, each one checked and converted by `toItem`
export function readList<T>(body: unknown, toItem: (value: unknown) => T): readonly T[] {
  const data: unknown = readData(body);
  if (!Array.isArray(data)) {
    throw createInvalidResponseError();
  }

  return data.map((item: unknown): T => toItem(item));
}
