import type { GameComment, GameCommentsPage } from '../types/game-details.ts';
import { isBoolean, isNumber, isRecord, isString } from './guards.ts';
import { getJson } from './http-client.ts';
import { createInvalidResponseError, readList } from './response.ts';

// The dialog shows the three newest comments of a game
const LATEST_COMMENTS = 3;
const NEWEST_FIRST = 'newest';

function toComment(value: unknown): GameComment {
  if (!isRecord(value)) {
    throw createInvalidResponseError();
  }
  const { commentId, authorName, text, likesCount, isLikedByCurrentUser, createdAt } = value;
  if (
    !isString(commentId) ||
    !isString(authorName) ||
    !isString(text) ||
    !isNumber(likesCount) ||
    !isBoolean(isLikedByCurrentUser) ||
    !isString(createdAt)
  ) {
    throw createInvalidResponseError();
  }

  return { commentId, authorName, text, likesCount, isLikedByCurrentUser, createdAt };
}

// The latest comments of a game and how many it has in all. An unknown slug
// fails with a NotFound error.
export async function fetchGameComments(
  slug: string,
  signal: AbortSignal,
): Promise<GameCommentsPage> {
  const body: unknown = await getJson(
    `/games/${encodeURIComponent(slug)}/comments`,
    { limit: String(LATEST_COMMENTS), sort: NEWEST_FIRST },
    signal,
  );
  const meta: unknown = isRecord(body) ? body.meta : undefined;
  const totalComments: unknown = isRecord(meta) ? meta.totalComments : undefined;
  if (!isNumber(totalComments)) {
    throw createInvalidResponseError();
  }

  return { comments: readList(body, toComment), totalComments };
}
