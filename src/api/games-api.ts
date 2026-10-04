import type { Game, GamesPage } from '../types/game.ts';
import type { LibraryQuery } from '../types/library.ts';
import { isNumber, isRecord, isString } from './guards.ts';
import { getJson } from './http-client.ts';
import { createInvalidResponseError, readList } from './response.ts';

// The Library shows six games on a page, the page size the task asks for
const PAGE_SIZE = 6;

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

// The page numbers of a list answer: { meta: { page, totalPages, ... } }
function readPageNumbers(body: unknown): Pick<GamesPage, 'page' | 'totalPages'> {
  const meta: unknown = isRecord(body) ? body.meta : undefined;
  if (!isRecord(meta)) {
    throw createInvalidResponseError();
  }
  const { page, totalPages } = meta;
  if (!isNumber(page) || !isNumber(totalPages)) {
    throw createInvalidResponseError();
  }

  return { page, totalPages };
}

// The games of the Home slider. With `featured` the API leaves out the other
// list parameters and returns them all on one page.
export async function fetchFeaturedGames(signal: AbortSignal): Promise<readonly Game[]> {
  const body: unknown = await getJson('/games', { featured: 'true' }, signal);

  return readList(body, toGame);
}

// One page of the Library's games. The server filters, sorts and cuts the
// list into pages; the app only shows what comes back.
export async function fetchGames(query: LibraryQuery, signal: AbortSignal): Promise<GamesPage> {
  const parameters: Readonly<Record<string, string>> = {
    category: query.category,
    sort: query.sort,
    page: String(query.page),
    limit: String(PAGE_SIZE),
  };
  const body: unknown = await getJson('/games', parameters, signal);

  return { games: readList(body, toGame), ...readPageNumbers(body) };
}
