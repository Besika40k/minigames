import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_MESSAGES } from '../data/auth.ts';
import {
  AuthErrorKind,
  AuthServiceError,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  toAuthServiceError,
} from './auth-service.ts';

// The parameters every Google provider of the service is given
const { setCustomParameters } = vi.hoisted(() => ({
  setCustomParameters: vi.fn<(parameters: Record<string, string>) => void>(),
}));

// Firebase is replaced at its boundary: the tests check what the service asks
// of it and what it makes of the answers
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: class {
    public readonly setCustomParameters = setCustomParameters;
  },
}));

const FAKE_AUTH: Auth = { name: 'fake-auth' } as unknown as Auth;

vi.mock('./firebase.ts', () => ({
  getFirebaseAuth: (): Auth => FAKE_AUTH,
}));

// A Firebase user with only the given fields: a missing name, email or photo
// is left out
function createCredential(user: Partial<User>): UserCredential {
  return { user } as UserCredential;
}

// A failure as Firebase reports it: an error with an "auth/..." code
function createFirebaseError(code: string): Error {
  return Object.assign(new Error(`Firebase: Error (${code}).`), { code });
}

async function getError(request: Promise<unknown>): Promise<AuthServiceError> {
  try {
    await request;
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      return error;
    }
    throw error;
  }

  throw new Error('The request did not fail.');
}

describe('signInWithEmail', (): void => {
  it('signs in with the email and password and returns the profile', async (): Promise<void> => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue(
      createCredential({ displayName: 'CozyGamer', email: 'cozy@minigames.com' }),
    );

    await expect(signInWithEmail('cozy@minigames.com', 'Secret1!')).resolves.toEqual({
      displayName: 'CozyGamer',
      email: 'cozy@minigames.com',
    });
    expect(signInWithEmailAndPassword).toHaveBeenCalledExactlyOnceWith(
      FAKE_AUTH,
      'cozy@minigames.com',
      'Secret1!',
    );
  });

  it('turns wrong credentials into a message to show', async (): Promise<void> => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      createFirebaseError('auth/invalid-credential'),
    );

    const error: AuthServiceError = await getError(signInWithEmail('cozy@x.com', 'wrong1'));

    expect(error.kind).toBe(AuthErrorKind.Failed);
    expect(error.code).toBe('auth/invalid-credential');
    expect(error.message).toBe(AUTH_ERROR_MESSAGES.byCode['auth/invalid-credential']);
  });
});

describe('registerWithEmail', (): void => {
  it('creates the account and saves the username as its display name', async (): Promise<void> => {
    const credential: UserCredential = createCredential({ email: 'cozy@minigames.com' });
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(credential);
    vi.mocked(updateProfile).mockResolvedValue();

    await expect(registerWithEmail('CozyGamer', 'cozy@minigames.com', 'Secret1!')).resolves.toEqual(
      { displayName: 'CozyGamer', email: 'cozy@minigames.com' },
    );
    expect(createUserWithEmailAndPassword).toHaveBeenCalledExactlyOnceWith(
      FAKE_AUTH,
      'cozy@minigames.com',
      'Secret1!',
    );
    expect(updateProfile).toHaveBeenCalledExactlyOnceWith(credential.user, {
      displayName: 'CozyGamer',
    });
  });

  it('reports an email that already has an account', async (): Promise<void> => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(
      createFirebaseError('auth/email-already-in-use'),
    );

    const error: AuthServiceError = await getError(
      registerWithEmail('CozyGamer', 'cozy@minigames.com', 'Secret1!'),
    );

    expect(error.message).toBe(AUTH_ERROR_MESSAGES.byCode['auth/email-already-in-use']);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('fails when the display name cannot be saved', async (): Promise<void> => {
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(
      createCredential({ email: 'cozy@minigames.com' }),
    );
    vi.mocked(updateProfile).mockRejectedValue(createFirebaseError('auth/network-request-failed'));

    const error: AuthServiceError = await getError(
      registerWithEmail('CozyGamer', 'cozy@minigames.com', 'Secret1!'),
    );

    expect(error.message).toBe(AUTH_ERROR_MESSAGES.byCode['auth/network-request-failed']);
  });
});

describe('signInWithGoogle', (): void => {
  it('opens the Google window with the account chooser', async (): Promise<void> => {
    vi.mocked(signInWithPopup).mockResolvedValue(
      createCredential({
        displayName: 'Alex Pro',
        email: 'alex@gmail.com',
        photoURL: 'https://lh3.googleusercontent.com/a/photo',
      }),
    );

    await expect(signInWithGoogle()).resolves.toEqual({
      displayName: 'Alex Pro',
      email: 'alex@gmail.com',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
    });

    const [auth, provider] = vi.mocked(signInWithPopup).mock.calls[0] ?? [];
    expect(auth).toBe(FAKE_AUTH);
    expect(provider).toBeInstanceOf(GoogleAuthProvider);
    expect(setCustomParameters).toHaveBeenCalledExactlyOnceWith({ prompt: 'select_account' });
  });

  it('names an account without a profile name after its email', async (): Promise<void> => {
    vi.mocked(signInWithPopup).mockResolvedValue(
      createCredential({ displayName: '  ', email: 'alex.pro@gmail.com' }),
    );

    await expect(signInWithGoogle()).resolves.toMatchObject({ displayName: 'alex.pro' });
  });

  it('reports a closed Google window as a cancel', async (): Promise<void> => {
    vi.mocked(signInWithPopup).mockRejectedValue(createFirebaseError('auth/popup-closed-by-user'));

    const error: AuthServiceError = await getError(signInWithGoogle());

    expect(error.kind).toBe(AuthErrorKind.Canceled);
    expect(error.message).toBe(AUTH_ERROR_MESSAGES.canceled);
  });

  it('fails for an account without an email', async (): Promise<void> => {
    vi.mocked(signInWithPopup).mockResolvedValue(createCredential({ displayName: 'Alex' }));

    const error: AuthServiceError = await getError(signInWithGoogle());

    expect(error.kind).toBe(AuthErrorKind.Failed);
    expect(error.message).toBe(AUTH_ERROR_MESSAGES.unknown);
  });
});

describe('signOutUser', (): void => {
  it('signs out of Firebase', async (): Promise<void> => {
    vi.mocked(signOut).mockResolvedValue();

    await signOutUser();

    expect(signOut).toHaveBeenCalledExactlyOnceWith(FAKE_AUTH);
  });

  it('reports a failed sign-out', async (): Promise<void> => {
    vi.mocked(signOut).mockRejectedValue(createFirebaseError('auth/network-request-failed'));

    await expect(signOutUser()).rejects.toBeInstanceOf(AuthServiceError);
  });
});

describe('toAuthServiceError', (): void => {
  it('falls back to a general message for an unknown code or a value without one', (): void => {
    expect(toAuthServiceError(createFirebaseError('auth/internal-error')).message).toBe(
      AUTH_ERROR_MESSAGES.unknown,
    );
    expect(toAuthServiceError('broken').code).toBeUndefined();
  });

  it('explains a missing or wrong project config', (): void => {
    expect(toAuthServiceError(createFirebaseError('auth/invalid-api-key')).message).toBe(
      AUTH_ERROR_MESSAGES.byCode['auth/invalid-api-key'],
    );
  });
});
