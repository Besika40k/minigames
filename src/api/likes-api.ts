import type { CommentLikeState } from '../types/game-details.ts';
import { isBoolean, isNumber, isRecord } from './guards.ts';
import { postJson } from './http-client.ts';
import { createInvalidResponseError, readData } from './response.ts';

// Likes a comment for the user, or takes the like back when it is there
// already: the server flips the state and answers with the new one. A second
// request would undo the first, so a toggle whose outcome is unknown is never
// sent again on its own.
export async function toggleCommentLike(
  commentId: string,
  userEmail: string,
): Promise<CommentLikeState> {
  const body: unknown = await postJson(`/comments/${encodeURIComponent(commentId)}/like`, {
    userEmail,
  });
  const data: unknown = readData(body);
  if (!isRecord(data) || !isBoolean(data.isLikedByCurrentUser) || !isNumber(data.likesCount)) {
    throw createInvalidResponseError();
  }

  return { isLikedByCurrentUser: data.isLikedByCurrentUser, likesCount: data.likesCount };
}
