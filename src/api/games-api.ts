import type { Game } from '../types/game.ts';
import { isNumber, isRecord, isString } from './guards.ts';
import { getJson } from './http-client.ts';
import { createInvalidResponseError, readList } from './response.ts';

// The API names its images by paths such as "/assets/images/games/palia-card.jpg"
// but does not serve them. The app ships the same files in public/assets, so a
// path is read from the app's own base ("/" or "/minigames/").
function resolveAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

function toGame(value: unknown): Game {
  if (!isRecord(value)) {
    throw createInvalidResponseError();
  }
  const { slug, name, category, price, shortDescription, rating, likesCount, cardImage } = value;
  if (
    !isString(slug) ||
    !isString(name) ||
    !isString(category) ||
    !isString(price) ||
    !isString(shortDescription) ||
    !isNumber(rating) ||
    !isNumber(likesCount) ||
    !isString(cardImage)
  ) {
    throw createInvalidResponseError();
  }

  return {
    slug,
    name,
    category,
    price,
    shortDescription,
    rating,
    likesCount,
    cardImage: resolveAssetUrl(cardImage),
  };
}

// The games of the Home slider. With `featured` the API leaves out the other
// list parameters and returns them all on one page.
export async function fetchFeaturedGames(signal: AbortSignal): Promise<readonly Game[]> {
  const body: unknown = await getJson('/games', { featured: 'true' }, signal);

  return readList(body, toGame);
}
