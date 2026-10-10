import type { AuthProfile } from '../types/auth.ts';
import {
  SessionEndReason,
  StoredSessionState,
  type AppSession,
  type StoredSession,
} from '../types/session.ts';
import {
  clearSession,
  createSession,
  getRemainingTime,
  readStoredSession,
  saveSession,
} from './session.ts';

export type SessionListener = (session: AppSession | undefined) => void;

export interface SessionStoreOptions {
  // Ends Firebase's own sign-in, so it cannot bring the user back
  readonly signOut: () => Promise<void>;
  // Tells the visitor that the session has expired
  readonly onExpire: () => void;
}

// The one place that decides whether the visitor is signed in. The stored
// session is the source of truth: every check reads it again, so a session
// that expired, was edited or was removed in another tab ends at the next
// check.
export interface SessionStore {
  // The active session, or undefined for a guest. An expired or broken stored
  // session ends here.
  readonly check: () => AppSession | undefined;
  // The session of the last check, without reading the storage again: the
  // user the screen shows right now
  readonly getCurrent: () => AppSession | undefined;
  // Starts the session of a successful sign-in
  readonly start: (profile: AuthProfile) => AppSession;
  // Ends the session and signs out of Firebase. A failed sign-out rejects,
  // but the app session is gone either way.
  readonly end: (reason: SessionEndReason) => Promise<void>;
  // Hears of every change between signed in and guest, or to another
  // session. Returns a function that stops listening.
  readonly subscribe: (listener: SessionListener) => () => void;
}

function isSameSession(first: AppSession | undefined, second: AppSession | undefined): boolean {
  return (
    first?.email === second?.email &&
    first?.displayName === second?.displayName &&
    first?.avatarUrl === second?.avatarUrl &&
    first?.authenticatedAt === second?.authenticatedAt
  );
}

export function createSessionStore(options: SessionStoreOptions): SessionStore {
  const listeners: Set<SessionListener> = new Set<SessionListener>();
  const state: { current?: AppSession; expiryTimer?: ReturnType<typeof setTimeout> } = {};

  const setCurrent = (session: AppSession | undefined): void => {
    if (isSameSession(state.current, session)) {
      return;
    }
    state.current = session;
    for (const listener of listeners) {
      listener(session);
    }
  };

  const stopTimer = (): void => {
    clearTimeout(state.expiryTimer);
    state.expiryTimer = undefined;
  };

  const end = async (reason: SessionEndReason): Promise<void> => {
    stopTimer();
    clearSession();
    setCurrent(undefined);
    if (reason === SessionEndReason.Expired) {
      options.onExpire();
    }
    await options.signOut();
  };

  // An expired or broken session ends on its own: a failed Firebase sign-out
  // changes nothing the visitor could act on
  const endSilently = async (reason: SessionEndReason): Promise<void> => {
    try {
      await end(reason);
    } catch {
      // The app session is already gone, and the app never trusts Firebase alone
    }
  };

  // The page flips to guest on time, even while nobody touches it
  const activate = (session: AppSession): void => {
    setCurrent(session);
    stopTimer();
    state.expiryTimer = setTimeout(check, getRemainingTime(session, Date.now()));
  };

  function check(): AppSession | undefined {
    const stored: StoredSession = readStoredSession(Date.now());

    switch (stored.state) {
      case StoredSessionState.Active: {
        activate(stored.session);
        return stored.session;
      }
      case StoredSessionState.Expired: {
        void endSilently(SessionEndReason.Expired);
        return undefined;
      }
      case StoredSessionState.Invalid: {
        void endSilently(SessionEndReason.Invalid);
        return undefined;
      }
      case StoredSessionState.None: {
        // Ended in another tab, which signed out of Firebase already
        stopTimer();
        setCurrent(undefined);
        return undefined;
      }
    }
  }

  const start = (profile: AuthProfile): AppSession => {
    const session: AppSession = createSession(profile, Date.now());
    saveSession(session);
    activate(session);

    return session;
  };

  return {
    check,
    getCurrent: (): AppSession | undefined => state.current,
    start,
    end,
    subscribe: (listener: SessionListener): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
  };
}
