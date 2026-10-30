import { FirebaseError } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore/lite';
import { FIRESTORE_ERROR_MESSAGES } from '../data/firestore.ts';
import { ApiError, ApiErrorKind } from './api-error.ts';
import { getFirebaseApp } from './firebase-app.ts';

// What the modules that talk to Firestore share: the database, the signed-in
// user, and the way a Firestore failure becomes an ApiError the app knows how
// to show. Only those modules import it, so it loads with them.

// Firestore starts once: later calls get the same instance
const started: { firestore?: Firestore } = {};

export function getDatabase(): Firestore {
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
  [ApiErrorKind.Unauthorized]: FIRESTORE_ERROR_MESSAGES.refused,
  [ApiErrorKind.NotFound]: FIRESTORE_ERROR_MESSAGES.notFound,
  [ApiErrorKind.RateLimit]: FIRESTORE_ERROR_MESSAGES.rateLimit,
  [ApiErrorKind.BadRequest]: FIRESTORE_ERROR_MESSAGES.refused,
  [ApiErrorKind.Network]: FIRESTORE_ERROR_MESSAGES.network,
  [ApiErrorKind.Server]: FIRESTORE_ERROR_MESSAGES.failed,
  [ApiErrorKind.InvalidResponse]: FIRESTORE_ERROR_MESSAGES.invalidData,
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
// ApiError, as the app expects of its data
export async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    throw toApiError(error);
  }
}

// The id of the user Firebase has signed in, or undefined for a guest. A
// signed-in visitor's page has loaded sign-in already; a guest asks for no id,
// so a guest's visit never downloads it.
export async function getUserId(userEmail: string | undefined): Promise<string | undefined> {
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
export async function requireUserId(userEmail: string): Promise<string> {
  const userId: string | undefined = await getUserId(userEmail);
  if (userId === undefined) {
    throw new ApiError(ApiErrorKind.Unauthorized, FIRESTORE_ERROR_MESSAGES.signedOut);
  }

  return userId;
}
