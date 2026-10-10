import type { GameComment, GameCommentsPage, NewComment } from '../types/game-details.ts';
import { isBoolean, isNumber, isRecord, isString } from './guards.ts';
import { getJson, postJson, type QueryParameters } from './http-client.ts';
import { createInvalidResponseError, readData, readList } from './response.ts';

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

// The latest comments of a game and how many it has in all. With the email of
// a signed-in user, each comment also says whether that user liked it. An
// unknown slug fails with a NotFound error.
export async function fetchGameComments(
  slug: string,
  signal: AbortSignal,
  userEmail?: string,
): Promise<GameCommentsPage> {
  const parameters: QueryParameters = {
    limit: String(LATEST_COMMENTS),
    sort: NEWEST_FIRST,
    ...(userEmail !== undefined && { userEmail }),
  };
  const body: unknown = await getJson(
    `/games/${encodeURIComponent(slug)}/comments`,
    parameters,
    signal,
  );
  const meta: unknown = isRecord(body) ? body.meta : undefined;
  const totalComments: unknown = isRecord(meta) ? meta.totalComments : undefined;
  if (!isNumber(totalComments)) {
    throw createInvalidResponseError();
  }

  return { comments: readList(body, toComment), totalComments };
}

// Posts a comment of the signed-in user; the server answers with the new
// comment (201). A second request would post it twice, so a comment whose
// outcome is unknown is never sent again on its own.
export async function postComment(slug: string, comment: NewComment): Promise<GameComment> {
  const body: unknown = await postJson(`/games/${encodeURIComponent(slug)}/comments`, {
    userEmail: comment.userEmail,
    authorName: comment.authorName,
    text: comment.text,
  });

  return toComment(readData(body));
}
