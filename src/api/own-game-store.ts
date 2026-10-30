import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCount,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import { FIRESTORE_ERROR_MESSAGES } from '../data/firestore.ts';
import { OWN_GAMES } from '../data/own-games.ts';
import type { OwnGame } from '../types/game.ts';
import type {
  CommentLikeState,
  FavoriteState,
  GameComment,
  GameCommentsPage,
  GameDetails,
  NewComment,
} from '../types/game-details.ts';
import { ApiError, ApiErrorKind } from './api-error.ts';
import { getDatabase, getUserId, requireUserId, run } from './firestore.ts';
import { isRecord, isString } from './guards.ts';
import { findOwnGame, getOwnGameDetails } from './own-games.ts';

// The only module that talks to Firestore. It keeps the favorites, comments
// and comment likes of the games of MiniGames itself, in the shapes of the
// course API, so the dialog shows them the same way. The data, with the rules
// that guard it (firestore.rules):
//
//   games/{slug}/favorites/{userId}                       { createdAt }
//   games/{slug}/comments/{commentId}                     { authorId, authorName, text, createdAt }
//   games/{slug}/comments/{commentId}/likes/{userId}      { createdAt }
//
// A favorite or a like is a document named by the user's id, so a user has at
// most one, and the numbers are counts of these documents, never a counter
// that a page could set to anything.

const GAMES = 'games';
const FAVORITES = 'favorites';
const COMMENTS = 'comments';
const LIKES = 'likes';

// The dialog shows the three newest comments of a game, as for the API's games
const LATEST_COMMENTS = 3;

function findGame(slug: string): OwnGame {
  const game: OwnGame | undefined = findOwnGame(slug);
  if (game === undefined) {
    throw new ApiError(ApiErrorKind.NotFound, FIRESTORE_ERROR_MESSAGES.notFound);
  }

  return game;
}

function getFavorites(slug: string): CollectionReference {
  return collection(getDatabase(), GAMES, slug, FAVORITES);
}

function getComments(slug: string): CollectionReference {
  return collection(getDatabase(), GAMES, slug, COMMENTS);
}

async function countDocuments(reference: CollectionReference): Promise<number> {
  const snapshot = await getCount(reference);

  return snapshot.data().count;
}

// Whether the user has a document in a list of favorites or likes; never for
// a guest
async function hasDocument(
  reference: CollectionReference,
  userId: string | undefined,
): Promise<boolean> {
  if (userId === undefined) {
    return false;
  }
  const snapshot: DocumentSnapshot = await getDoc(doc(reference, userId));

  return snapshot.exists();
}

// Adds the user's document to a list of favorites or likes, or removes it
// when it is there. Answers whether it is there now and how many there are.
async function toggleDocument(
  reference: CollectionReference,
  userId: string,
): Promise<{ isOn: boolean; count: number }> {
  const own: DocumentReference = doc(reference, userId);
  const snapshot: DocumentSnapshot = await getDoc(own);
  const isOn: boolean = !snapshot.exists();
  await (isOn ? setDoc(own, { createdAt: serverTimestamp() }) : deleteDoc(own));

  return { isOn, count: await countDocuments(reference) };
}

// The likes of a game: how many users have it among their favorites
export async function countOwnGameLikes(slug: string): Promise<number> {
  return run(async (): Promise<number> => countDocuments(getFavorites(slug)));
}

export async function fetchOwnGameDetails(
  slug: string,
  signal: AbortSignal,
  userEmail?: string,
): Promise<GameDetails> {
  return run(async (): Promise<GameDetails> => {
    const game: OwnGame = findGame(slug);
    const userId: string | undefined = await getUserId(userEmail);
    signal.throwIfAborted();
    const favorites: CollectionReference = getFavorites(slug);
    const [likesCount, isFavorite] = await Promise.all([
      countDocuments(favorites),
      hasDocument(favorites, userId),
    ]);

    return { ...getOwnGameDetails(game), likesCount, isLikedByCurrentUser: isFavorite };
  });
}

export async function toggleOwnGameFavorite(
  slug: string,
  userEmail: string,
): Promise<FavoriteState> {
  return run(async (): Promise<FavoriteState> => {
    findGame(slug);
    const userId: string = await requireUserId(userEmail);
    const { isOn, count } = await toggleDocument(getFavorites(slug), userId);

    return { isFavorited: isOn, likesCount: count };
  });
}

// A comment as the dialog shows it, with its likes and whether the user liked
// it. A document without the fields of a comment is invalid data.
async function toComment(
  snapshot: QueryDocumentSnapshot,
  userId: string | undefined,
): Promise<GameComment> {
  const data: unknown = snapshot.data();
  const { authorName, text, createdAt } = isRecord(data) ? data : {};
  if (!isString(authorName) || !isString(text) || !(createdAt instanceof Timestamp)) {
    throw new ApiError(ApiErrorKind.InvalidResponse, FIRESTORE_ERROR_MESSAGES.invalidData);
  }
  const likes: CollectionReference = collection(snapshot.ref, LIKES);
  const [likesCount, isLikedByCurrentUser] = await Promise.all([
    countDocuments(likes),
    hasDocument(likes, userId),
  ]);

  return {
    commentId: snapshot.id,
    authorName,
    text,
    likesCount,
    isLikedByCurrentUser,
    createdAt: createdAt.toDate().toISOString(),
  };
}

export async function fetchOwnGameComments(
  slug: string,
  signal: AbortSignal,
  userEmail?: string,
): Promise<GameCommentsPage> {
  return run(async (): Promise<GameCommentsPage> => {
    findGame(slug);
    const userId: string | undefined = await getUserId(userEmail);
    signal.throwIfAborted();
    const comments: CollectionReference = getComments(slug);
    const newest: Query = query(comments, orderBy('createdAt', 'desc'), limit(LATEST_COMMENTS));
    const [latest, totalComments] = await Promise.all([getDocs(newest), countDocuments(comments)]);

    return {
      comments: await Promise.all(
        latest.docs.map((snapshot: QueryDocumentSnapshot): Promise<GameComment> =>
          toComment(snapshot, userId),
        ),
      ),
      totalComments,
    };
  });
}

// The comment carries the user's id, which the rules check against the
// signed-in user, and the server's time
export async function postOwnGameComment(slug: string, comment: NewComment): Promise<void> {
  await run(async (): Promise<void> => {
    findGame(slug);
    const userId: string = await requireUserId(comment.userEmail);
    await addDoc(getComments(slug), {
      authorId: userId,
      authorName: comment.authorName,
      text: comment.text,
      createdAt: serverTimestamp(),
    });
  });
}

export async function toggleOwnGameCommentLike(
  slug: string,
  commentId: string,
  userEmail: string,
): Promise<CommentLikeState> {
  return run(async (): Promise<CommentLikeState> => {
    findGame(slug);
    const userId: string = await requireUserId(userEmail);
    const likes: CollectionReference = collection(getComments(slug), commentId, LIKES);
    const { isOn, count } = await toggleDocument(likes, userId);

    return { isLikedByCurrentUser: isOn, likesCount: count };
  });
}

// The slugs of the games of MiniGames itself the user has among their
// favorites
export async function listOwnGameFavorites(userEmail: string): Promise<readonly string[]> {
  return run(async (): Promise<readonly string[]> => {
    const userId: string = await requireUserId(userEmail);
    const favoriteFlags: readonly boolean[] = await Promise.all(
      OWN_GAMES.map((game: OwnGame): Promise<boolean> =>
        hasDocument(getFavorites(game.slug), userId),
      ),
    );

    return OWN_GAMES.filter(
      (_game: OwnGame, index: number): boolean => favoriteFlags[index] === true,
    ).map((game: OwnGame): string => game.slug);
  });
}
