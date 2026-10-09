import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { isRecord, isString } from '../api/guards.ts';
import { AUTH_ERROR_MESSAGES, CANCELED_AUTH_CODES } from '../data/auth.ts';
import type { AuthProfile } from '../types/auth.ts';
import { getFirebaseAuth } from './firebase.ts';

// The only module that talks to Firebase Authentication. Every sign-in gives
// the profile the app session keeps, and every failure is an AuthServiceError
// with a message fit to show.

export enum AuthErrorKind {
  // The visitor closed the Google window: nothing went wrong
  Canceled = 'canceled',
  Failed = 'failed',
}

export class AuthServiceError extends Error {
  public readonly kind: AuthErrorKind;
  // The Firebase error code, such as "auth/invalid-credential"
  public readonly code: string | undefined;

  public constructor(kind: AuthErrorKind, message: string, code?: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.kind = kind;
    this.code = code;
  }
}

function getErrorCode(error: unknown): string | undefined {
  const code: unknown = isRecord(error) ? error.code : undefined;

  return isString(code) ? code : undefined;
}

// A Firebase failure as the app shows it
export function toAuthServiceError(error: unknown): AuthServiceError {
  const code: string | undefined = getErrorCode(error);
  if (code !== undefined && CANCELED_AUTH_CODES.has(code)) {
    return new AuthServiceError(AuthErrorKind.Canceled, AUTH_ERROR_MESSAGES.canceled, code);
  }
  const message: string =
    (code === undefined ? undefined : AUTH_ERROR_MESSAGES.byCode[code]) ??
    AUTH_ERROR_MESSAGES.unknown;

  return new AuthServiceError(AuthErrorKind.Failed, message, code);
}

// The name the app shows: the profile name, else the part of the email
// before the @, as a Google account or an older account may have no name
function getDisplayName(user: User, email: string): string {
  const name: string = user.displayName?.trim() ?? '';

  return name === '' ? (email.split('@', 1)[0] ?? email) : name;
}

export function toAuthProfile(user: User): AuthProfile {
  const email: string = user.email ?? '';
  // Email/password and Google accounts always have an email
  if (email === '') {
    throw new AuthServiceError(AuthErrorKind.Failed, AUTH_ERROR_MESSAGES.unknown);
  }
  const profile: AuthProfile = { displayName: getDisplayName(user, email), email };
  const avatarUrl: string = user.photoURL ?? '';

  return avatarUrl === '' ? profile : { ...profile, avatarUrl };
}

// Runs a Firebase call and turns its failure into an AuthServiceError
async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    throw error instanceof AuthServiceError ? error : toAuthServiceError(error);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthProfile> {
  return run(async (): Promise<AuthProfile> => {
    const credential: UserCredential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );

    return toAuthProfile(credential.user);
  });
}

// Creates the account and saves the username as its Firebase display name
export async function registerWithEmail(
  username: string,
  email: string,
  password: string,
): Promise<AuthProfile> {
  return run(async (): Promise<AuthProfile> => {
    const credential: UserCredential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    await updateProfile(credential.user, { displayName: username });

    return { ...toAuthProfile(credential.user), displayName: username };
  });
}

// Signs in through Google's own window. The account chooser opens every time,
// so after a logout the visitor can pick another account.
export async function signInWithGoogle(): Promise<AuthProfile> {
  return run(async (): Promise<AuthProfile> => {
    const provider: GoogleAuthProvider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential: UserCredential = await signInWithPopup(getFirebaseAuth(), provider);

    return toAuthProfile(credential.user);
  });
}

// Ends Firebase's own sign-in too, so it cannot bring the user back after the
// app session has ended
export async function signOutUser(): Promise<void> {
  await run(async (): Promise<void> => {
    await signOut(getFirebaseAuth());
  });
}
