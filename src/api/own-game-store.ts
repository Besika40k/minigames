import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCount,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import { OWN_GAME_ERROR_MESSAGES } from '../data/own-games.ts';
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
import { getFirebaseApp } from './firebase-app.ts';
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

// Firestore starts once: later calls get the same instance
const started: { firestore?: Firestore } = {};

function getDatabase(): Firestore {
  started.firestore ??= getFirestore(getFirebaseApp());

  return started.firestore;
}

// The failures of Firestore (its error codes), by the kind of ApiError the
// app already knows how to show. A code missing here is a failure of the
// server, whose outcome is unknown.
const KINDS_BY_CODE: ReadonlyMap<string, ApiErrorKind> = new Map([
  ['permission-denied', ApiErrorKind.Unauthorized],
  ['unauthenticated', ApiErrorKind.Unauthorized],
  ['not-found', ApiErrorKind.NotFound],
  ['resource-exhausted', ApiErrorKind.RateLimit],
  ['invalid-argument', ApiErrorKind.BadRequest],
  ['failed-precondition', ApiErrorKind.BadRequest],
  ['unavailable', ApiErrorKind.Network],
  ['deadline-exceeded', ApiErrorKind.Network],
]);

const MESSAGES_BY_KIND: Readonly<Record<ApiErrorKind, string>> = {
  [ApiErrorKind.Unauthorized]: OWN_GAME_ERROR_MESSAGES.refused,
  [ApiErrorKind.NotFound]: OWN_GAME_ERROR_MESSAGES.notFound,
  [ApiErrorKind.RateLimit]: OWN_GAME_ERROR_MESSAGES.rateLimit,
  [ApiErrorKind.BadRequest]: OWN_GAME_ERROR_MESSAGES.refused,
  [ApiErrorKind.Network]: OWN_GAME_ERROR_MESSAGES.network,
  [ApiErrorKind.Server]: OWN_GAME_ERROR_MESSAGES.failed,
  [ApiErrorKind.InvalidResponse]: OWN_GAME_ERROR_MESSAGES.invalidData,
};

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  const code: string | undefined = error instanceof FirebaseError ? error.code : undefined;
  const kind: ApiErrorKind =
    (code === undefined ? undefined : KINDS_BY_CODE.get(code)) ?? ApiErrorKind.Server;

  return new ApiError(kind, MESSAGES_BY_KIND[kind]);
}

// Runs the Firestore calls of one operation and turns any failure into an
// ApiError, as the dialog expects of a backend
async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    throw toApiError(error);
  }
}

function findGame(slug: string): OwnGame {
  const game: OwnGame | undefined = findOwnGame(slug);
  if (game === undefined) {
    throw new ApiError(ApiErrorKind.NotFound, OWN_GAME_ERROR_MESSAGES.notFound);
  }

  return game;
}

// The id of the user Firebase has signed in, or undefined for a guest. A
// signed-in visitor's page has loaded sign-in already; a guest asks for no id,
// so a guest's visit never downloads it.
async function getUserId(userEmail: string | undefined): Promise<string | undefined> {
  if (userEmail === undefined) {
    return undefined;
  }
  const { getFirebaseAuth } = await import('../auth/firebase.ts');
  const auth = getFirebaseAuth();
  // After a reload Firebase reads its sign-in back first
  await auth.authStateReady();

  return auth.currentUser?.uid;
}

// A change needs the signed-in user: the rules accept it only from that user
async function requireUserId(userEmail: string): Promise<string> {
  const userId: string | undefined = await getUserId(userEmail);
  if (userId === undefined) {
    throw new ApiError(ApiErrorKind.Unauthorized, OWN_GAME_ERROR_MESSAGES.signedOut);
  }

  return userId;
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
    throw new ApiError(ApiErrorKind.InvalidResponse, OWN_GAME_ERROR_MESSAGES.invalidData);
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
