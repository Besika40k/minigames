import type { FavoriteState } from '../types/game-details.ts';
import { isBoolean, isNumber, isRecord } from './guards.ts';
import { postJson } from './http-client.ts';
import { createInvalidResponseError, readData } from './response.ts';

// Adds a game to the user's favorites, or removes it when it is there already:
// the server flips the state and answers with the new one. A second request
// would undo the first, so a toggle whose outcome is unknown is never sent
// again on its own.
export async function toggleFavorite(slug: string, userEmail: string): Promise<FavoriteState> {
  const body: unknown = await postJson(`/games/${encodeURIComponent(slug)}/favorite`, {
    userEmail,
  });
  const data: unknown = readData(body);
  if (!isRecord(data) || !isBoolean(data.isFavorited) || !isNumber(data.likesCount)) {
    throw createInvalidResponseError();
  }

  return { isFavorited: data.isFavorited, likesCount: data.likesCount };
}
