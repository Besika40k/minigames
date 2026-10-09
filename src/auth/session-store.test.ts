import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { AuthProfile } from '../types/auth.ts';
import { SessionEndReason, type AppSession } from '../types/session.ts';
import { SESSION_LIFETIME, SESSION_STORAGE_KEY } from './session.ts';
import { createSessionStore, type SessionListener, type SessionStore } from './session-store.ts';

const NOW: number = Date.UTC(2026, 9, 9, 12, 0, 0);

const PROFILE: AuthProfile = { displayName: 'CozyGamer', email: 'cozy@minigames.com' };

interface TestStore {
  readonly store: SessionStore;
  readonly signOut: Mock<() => Promise<void>>;
  readonly onExpire: Mock<() => void>;
  readonly listener: Mock<SessionListener>;
}

function createTestStore(): TestStore {
  const signOut: Mock<() => Promise<void>> = vi.fn<() => Promise<void>>().mockResolvedValue();
  const onExpire: Mock<() => void> = vi.fn<() => void>();
  const listener: Mock<SessionListener> = vi.fn<SessionListener>();
  const store: SessionStore = createSessionStore({ signOut, onExpire });
  store.subscribe(listener);

  return { store, signOut, onExpire, listener };
}

function storeSession(session: Record<string, unknown>): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function readStoredKey(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

beforeEach((): void => {
  vi.useFakeTimers({ now: NOW });
  localStorage.clear();
});

afterEach((): void => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('session store', (): void => {
  it('starts a session with the sign-in time and stores only the session fields', (): void => {
    const { store, listener } = createTestStore();

    const session: AppSession = store.start({ ...PROFILE, avatarUrl: 'https://photo' });

    const expected: AppSession = { ...PROFILE, avatarUrl: 'https://photo', authenticatedAt: NOW };
    expect(session).toEqual(expected);
    expect(JSON.parse(readStoredKey() ?? '')).toEqual(expected);
    expect(listener).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it('restores a stored session without moving its sign-in time', (): void => {
    storeSession({ ...PROFILE, authenticatedAt: NOW - 60_000 });
    vi.setSystemTime(NOW);
    const { store, listener, signOut } = createTestStore();

    expect(store.check()).toEqual({ ...PROFILE, authenticatedAt: NOW - 60_000 });
    expect(store.check()?.authenticatedAt).toBe(NOW - 60_000);
    expect(listener).toHaveBeenCalledOnce();
    expect(signOut).not.toHaveBeenCalled();
    expect(JSON.parse(readStoredKey() ?? '')).toMatchObject({ authenticatedAt: NOW - 60_000 });
  });

  it('ends an expired session once, with one expiry message', (): void => {
    localStorage.setItem('other-app', 'kept');
    storeSession({ ...PROFILE, authenticatedAt: NOW - SESSION_LIFETIME });
    const { store, listener, signOut, onExpire } = createTestStore();

    expect(store.check()).toBeUndefined();
    expect(store.check()).toBeUndefined();

    expect(readStoredKey()).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('kept');
    expect(signOut).toHaveBeenCalledOnce();
    expect(onExpire).toHaveBeenCalledOnce();
    expect(listener).not.toHaveBeenCalled();
  });

  it('switches to guest when the lifetime runs out while the page is open', (): void => {
    const { store, listener, signOut, onExpire } = createTestStore();
    store.start(PROFILE);

    vi.advanceTimersByTime(SESSION_LIFETIME - 1);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenLastCalledWith(undefined);
    expect(readStoredKey()).toBeNull();
    expect(signOut).toHaveBeenCalledOnce();
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('ends a session whose stored time was moved back', (): void => {
    const { store, listener, onExpire } = createTestStore();
    store.start(PROFILE);

    storeSession({ ...PROFILE, authenticatedAt: NOW - 10 * 60_000 });

    expect(store.check()).toBeUndefined();
    expect(listener).toHaveBeenLastCalledWith(undefined);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('removes invalid stored data, signs out and starts as a guest without a message', (): void => {
    for (const text of ['{broken', JSON.stringify({ ...PROFILE }), '{"displayName":1}']) {
      localStorage.setItem(SESSION_STORAGE_KEY, text);
      const { store, signOut, onExpire } = createTestStore();

      expect(store.check()).toBeUndefined();
      expect(readStoredKey()).toBeNull();
      expect(signOut).toHaveBeenCalledOnce();
      expect(onExpire).not.toHaveBeenCalled();
    }
  });

  it('treats a sign-in time in the future as invalid', (): void => {
    storeSession({ ...PROFILE, authenticatedAt: NOW + 60_000 });
    const { store, signOut, onExpire } = createTestStore();

    expect(store.check()).toBeUndefined();
    expect(signOut).toHaveBeenCalledOnce();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('keeps the guest state when the expiry sign-out fails', async (): Promise<void> => {
    storeSession({ ...PROFILE, authenticatedAt: NOW - SESSION_LIFETIME });
    const { store, signOut } = createTestStore();
    signOut.mockRejectedValue(new Error('offline'));

    expect(store.check()).toBeUndefined();
    await vi.runAllTimersAsync();

    expect(readStoredKey()).toBeNull();
  });

  it('ends a session on logout without the expiry message', async (): Promise<void> => {
    const { store, listener, signOut, onExpire } = createTestStore();
    store.start(PROFILE);

    await store.end(SessionEndReason.Logout);

    expect(readStoredKey()).toBeNull();
    expect(listener).toHaveBeenLastCalledWith(undefined);
    expect(signOut).toHaveBeenCalledOnce();
    expect(onExpire).not.toHaveBeenCalled();

    // The timer of the ended session is gone
    vi.advanceTimersByTime(SESSION_LIFETIME);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('passes a failed logout sign-out on, with the session already ended', async (): Promise<void> => {
    const { store, signOut } = createTestStore();
    store.start(PROFILE);
    signOut.mockRejectedValue(new Error('offline'));

    await expect(store.end(SessionEndReason.Logout)).rejects.toThrow('offline');
    expect(store.check()).toBeUndefined();
  });

  it('turns to guest when the session is removed elsewhere, without signing out again', (): void => {
    const { store, listener, signOut } = createTestStore();
    store.start(PROFILE);

    localStorage.removeItem(SESSION_STORAGE_KEY);

    expect(store.check()).toBeUndefined();
    expect(listener).toHaveBeenLastCalledWith(undefined);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('stops telling a listener that unsubscribed', (): void => {
    const { store } = createTestStore();
    const listener: Mock<SessionListener> = vi.fn<SessionListener>();
    const unsubscribe: () => void = store.subscribe(listener);

    unsubscribe();
    store.start(PROFILE);

    expect(listener).not.toHaveBeenCalled();
  });
});
