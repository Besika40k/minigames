import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoredSessionState, type AppSession } from '../types/session.ts';
import {
  clearSession,
  createSession,
  getRemainingTime,
  isSessionExpired,
  parseSession,
  readStoredSession,
  saveSession,
  SESSION_LIFETIME,
  SESSION_STORAGE_KEY,
} from './session.ts';

const SIGN_IN_TIME: number = Date.UTC(2026, 9, 9, 12, 0, 0);

const SESSION: AppSession = {
  displayName: 'CozyGamer',
  email: 'cozy@minigames.com',
  authenticatedAt: SIGN_IN_TIME,
};

// Storage as a browser with storage turned off answers every access
function refuse(): never {
  throw new DOMException('Storage is disabled', 'SecurityError');
}

beforeEach((): void => {
  localStorage.clear();
});

afterEach((): void => {
  localStorage.clear();
});

describe('createSession', (): void => {
  it('keeps the profile and the sign-in time', (): void => {
    expect(
      createSession({ displayName: 'CozyGamer', email: 'cozy@minigames.com' }, SIGN_IN_TIME),
    ).toEqual(SESSION);
  });

  it('keeps the avatar only when the profile has one', (): void => {
    expect(
      createSession(
        { displayName: 'Alex', email: 'alex@gmail.com', avatarUrl: 'https://photo' },
        SIGN_IN_TIME,
      ),
    ).toEqual({
      displayName: 'Alex',
      email: 'alex@gmail.com',
      authenticatedAt: SIGN_IN_TIME,
      avatarUrl: 'https://photo',
    });
    expect(Object.keys(createSession(SESSION, SIGN_IN_TIME))).not.toContain('avatarUrl');
  });
});

describe('parseSession', (): void => {
  it('reads a stored session and leaves out unknown fields', (): void => {
    const text: string = JSON.stringify({ ...SESSION, avatarUrl: 'https://photo', token: 'x' });

    expect(parseSession(text)).toEqual({ ...SESSION, avatarUrl: 'https://photo' });
  });

  it('rejects text that is not JSON or not an object', (): void => {
    for (const text of ['', '{broken', 'null', '[]', '"session"', '42']) {
      expect(parseSession(text), text).toBeUndefined();
    }
  });

  it('rejects a session with a missing field or a field of the wrong type', (): void => {
    const broken: readonly Record<string, unknown>[] = [
      { email: SESSION.email, authenticatedAt: SIGN_IN_TIME },
      { ...SESSION, displayName: '' },
      { ...SESSION, email: 42 },
      { ...SESSION, authenticatedAt: String(SIGN_IN_TIME) },
      { ...SESSION, authenticatedAt: 1.5 },
      { ...SESSION, authenticatedAt: -1 },
      { ...SESSION, avatarUrl: false },
    ];

    for (const data of broken) {
      expect(parseSession(JSON.stringify(data)), JSON.stringify(data)).toBeUndefined();
    }
  });
});

describe('session lifetime', (): void => {
  it('lasts five minutes from the sign-in', (): void => {
    expect(SESSION_LIFETIME).toBe(5 * 60 * 1000);
    expect(isSessionExpired(SESSION, SIGN_IN_TIME + SESSION_LIFETIME - 1)).toBe(false);
    expect(isSessionExpired(SESSION, SIGN_IN_TIME + SESSION_LIFETIME)).toBe(true);
  });

  it('counts the time left down to zero', (): void => {
    expect(getRemainingTime(SESSION, SIGN_IN_TIME + 60_000)).toBe(SESSION_LIFETIME - 60_000);
    expect(getRemainingTime(SESSION, SIGN_IN_TIME + SESSION_LIFETIME + 1)).toBe(0);
  });
});

describe('stored session', (): void => {
  it('saves the session as one JSON object under the project key', (): void => {
    saveSession(SESSION);

    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(SESSION);
    expect(SESSION_STORAGE_KEY).toBe('minigames:besika40k:app-session');
  });

  it('reads an active, an expired, an invalid and a missing session', (): void => {
    expect(readStoredSession(SIGN_IN_TIME)).toEqual({ state: StoredSessionState.None });

    saveSession(SESSION);
    expect(readStoredSession(SIGN_IN_TIME + 1000)).toEqual({
      state: StoredSessionState.Active,
      session: SESSION,
    });
    expect(readStoredSession(SIGN_IN_TIME + SESSION_LIFETIME)).toEqual({
      state: StoredSessionState.Expired,
      session: SESSION,
    });

    localStorage.setItem(SESSION_STORAGE_KEY, '{broken');
    expect(readStoredSession(SIGN_IN_TIME)).toEqual({ state: StoredSessionState.Invalid });
  });

  it('treats a sign-in time in the future as invalid', (): void => {
    saveSession(SESSION);

    expect(readStoredSession(SIGN_IN_TIME - 1).state).toBe(StoredSessionState.Invalid);
  });

  it('removes only its own key', (): void => {
    localStorage.setItem('other-app', 'kept');
    saveSession(SESSION);

    clearSession();

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('kept');
  });

  it('behaves as a guest when the browser refuses storage', (): void => {
    // A session that a working storage would return as active
    saveSession(SESSION);
    vi.spyOn(localStorage, 'getItem').mockImplementation(refuse);
    vi.spyOn(localStorage, 'setItem').mockImplementation(refuse);
    vi.spyOn(localStorage, 'removeItem').mockImplementation(refuse);

    expect((): void => {
      saveSession(SESSION);
      clearSession();
    }).not.toThrow();
    expect(readStoredSession(SIGN_IN_TIME)).toEqual({ state: StoredSessionState.None });
  });
});
