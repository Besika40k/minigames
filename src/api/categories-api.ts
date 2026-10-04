import type { Category } from '../types/library.ts';
import { isBoolean, isRecord, isString } from './guards.ts';
import { getJson } from './http-client.ts';
import { createInvalidResponseError, readList } from './response.ts';

function toCategory(value: unknown): Category {
  if (!isRecord(value)) {
    throw createInvalidResponseError();
  }
  const { slug, label, isDefault } = value;
  if (!isString(slug) || !isString(label) || !isBoolean(isDefault)) {
    throw createInvalidResponseError();
  }

  return { slug, label, isDefault };
}

// The categories of the Library's chips, in the order to show them. One of
// them is the default.
export async function fetchCategories(signal: AbortSignal): Promise<readonly Category[]> {
  const body: unknown = await getJson('/categories', {}, signal);

  return readList(body, toCategory);
}
