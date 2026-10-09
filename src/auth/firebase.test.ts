import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFirebaseAuth } from './firebase.ts';

const FAKE_APP: FirebaseApp = { name: 'fake-app' } as FirebaseApp;
const FAKE_AUTH: Auth = { name: 'fake-auth' } as unknown as Auth;

vi.mock('firebase/app', () => ({ initializeApp: vi.fn((): FirebaseApp => FAKE_APP) }));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn((): Auth => FAKE_AUTH) }));

afterEach((): void => {
  vi.unstubAllEnvs();
});

describe('getFirebaseAuth', (): void => {
  it('starts Firebase once, with the project config from the environment', (): void => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'minigames-test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'minigames-test');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'minigames-test.firebasestorage.app');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '1234567890');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:1234567890:web:abc');

    expect(getFirebaseAuth()).toBe(FAKE_AUTH);
    expect(getFirebaseAuth()).toBe(FAKE_AUTH);

    expect(initializeApp).toHaveBeenCalledExactlyOnceWith({
      apiKey: 'test-api-key',
      authDomain: 'minigames-test.firebaseapp.com',
      projectId: 'minigames-test',
      storageBucket: 'minigames-test.firebasestorage.app',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:abc',
    });
    expect(getAuth).toHaveBeenCalledExactlyOnceWith(FAKE_APP);
  });
});
