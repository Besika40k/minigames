import { getDoc, setDoc } from 'firebase/firestore/lite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRESTORE_ERROR_MESSAGES } from '../data/firestore.ts';
import { ApiError, ApiErrorKind } from './api-error.ts';
import { fetchUserProfile, saveUserProfile } from './profile-store.ts';

// Firestore without a server: a document is its path
vi.mock('firebase/firestore/lite', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_database: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-time'),
}));
vi.mock('./firebase-app.ts', () => ({ getFirebaseApp: vi.fn() }));
vi.mock('../auth/firebase.ts', () => ({ getFirebaseAuth: vi.fn(() => auth) }));

// The signed-in user of Firebase, or none
const auth: { currentUser: { uid: string } | undefined; authStateReady: () => Promise<void> } = {
  currentUser: undefined,
  authStateReady: vi.fn((): Promise<void> => Promise.resolve()),
};

const EMAIL = 'alex@minigames.com';
const PHOTO = 'data:image/webp;base64,AAAA';

// The profile document holds these fields, or does not exist
function answerProfile(data: unknown): void {
  vi.mocked(getDoc).mockResolvedValue({ data: () => data } as Awaited<ReturnType<typeof getDoc>>);
}

beforeEach((): void => {
  vi.clearAllMocks();
  vi.mocked(setDoc).mockResolvedValue();
  auth.currentUser = { uid: 'user-1' };
});

describe('fetchUserProfile', (): void => {
  it('reads the bio and the picture of the signed-in user', async (): Promise<void> => {
    answerProfile({ bio: 'I brew potions.', photo: PHOTO, updatedAt: 'some time' });

    await expect(fetchUserProfile(EMAIL)).resolves.toEqual({
      bio: 'I brew potions.',
      photo: PHOTO,
    });
    expect(getDoc).toHaveBeenCalledExactlyOnceWith({ path: 'users/user-1' });
  });

  it('gives an empty profile to a user who has saved none', async (): Promise<void> => {
    answerProfile(undefined);

    await expect(fetchUserProfile(EMAIL)).resolves.toEqual({ bio: '' });
  });

  it('leaves out an empty picture', async (): Promise<void> => {
    answerProfile({ bio: '', photo: '' });

    await expect(fetchUserProfile(EMAIL)).resolves.toEqual({ bio: '' });
  });

  it('refuses when Firebase has no signed-in user', async (): Promise<void> => {
    auth.currentUser = undefined;

    await expect(fetchUserProfile(EMAIL)).rejects.toEqual(
      new ApiError(ApiErrorKind.Unauthorized, FIRESTORE_ERROR_MESSAGES.signedOut),
    );
  });
});

describe('saveUserProfile', (): void => {
  it("writes the whole profile with the server's time", async (): Promise<void> => {
    await saveUserProfile(EMAIL, { bio: 'Hi', photo: PHOTO });

    expect(setDoc).toHaveBeenCalledExactlyOnceWith(
      { path: 'users/user-1' },
      { bio: 'Hi', photo: PHOTO, updatedAt: 'server-time' },
    );
  });

  it('writes an empty picture for a profile without one', async (): Promise<void> => {
    await saveUserProfile(EMAIL, { bio: 'Hi' });

    expect(setDoc).toHaveBeenCalledExactlyOnceWith(
      { path: 'users/user-1' },
      { bio: 'Hi', photo: '', updatedAt: 'server-time' },
    );
  });
});
