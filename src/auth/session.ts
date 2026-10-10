import { isNumber, isRecord, isString } from '../api/guards.ts';
import type { AuthProfile } from '../types/auth.ts';
import { StoredSessionState, type AppSession, type StoredSession } from '../types/session.ts';

// The app session in localStorage: one JSON object under a key of this
// project only, so ending a session never touches another app's data
export const SESSION_STORAGE_KEY = 'minigames:besika40k:app-session';

const MINUTE = 60_000;
const SESSION_MINUTES = 5;

// A session lasts this long from its sign-in, however the app is used
export const SESSION_LIFETIME: number = SESSION_MINUTES * MINUTE;

function isFilledString(value: unknown): value is string {
  return isString(value) && value !== '';
}

// A Date.now() value: whole milliseconds after 1970
function isTimestamp(value: unknown): value is number {
  return isNumber(value) && Number.isSafeInteger(value) && value > 0;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

// The session to keep after a sign-in: the profile and the sign-in time, and
// nothing else
export function createSession(profile: AuthProfile, now: number): AppSession {
  const session: AppSession = {
    displayName: profile.displayName,
    email: profile.email,
    authenticatedAt: now,
  };

  return profile.avatarUrl === undefined ? session : { ...session, avatarUrl: profile.avatarUrl };
}

// The session in a stored text, or undefined when the text is not JSON or
// lacks a field of a session or has one of the wrong type. Other fields are
// left out.
export function parseSession(text: string): AppSession | undefined {
  const data: unknown = parseJson(text);
  if (!isRecord(data)) {
    return undefined;
  }
  const { displayName, email, authenticatedAt, avatarUrl } = data;

  return isFilledString(displayName) &&
    isFilledString(email) &&
    isTimestamp(authenticatedAt) &&
    (avatarUrl === undefined || isFilledString(avatarUrl))
    ? createSession({ displayName, email, avatarUrl }, authenticatedAt)
    : undefined;
}

export function isSessionExpired(session: AppSession, now: number): boolean {
  return now - session.authenticatedAt >= SESSION_LIFETIME;
}

// How long the session has left, never below zero
export function getRemainingTime(session: AppSession, now: number): number {
  return Math.max(session.authenticatedAt + SESSION_LIFETIME - now, 0);
}

// The browser may refuse storage (a privacy setting), so every access is
// guarded: without storage the visitor is a guest after a reload
function readStorage(): string | undefined {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

// The stored session and its state at the given time. A sign-in time in the
// future was not written by the app (it would make the session last longer),
// so it makes the session invalid.
export function readStoredSession(now: number): StoredSession {
  const text: string | undefined = readStorage();
  if (text === undefined) {
    return { state: StoredSessionState.None };
  }
  const session: AppSession | undefined = parseSession(text);

  return session === undefined || session.authenticatedAt > now
    ? { state: StoredSessionState.Invalid }
    : {
        state: isSessionExpired(session, now)
          ? StoredSessionState.Expired
          : StoredSessionState.Active,
        session,
      };
}

export function saveSession(session: AppSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The session still lasts until the page is closed
  }
}

// Removes this app's session key and nothing else
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing could be stored either
  }
}
