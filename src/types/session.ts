import type { AuthProfile } from './auth.ts';

// The app session: the signed-in profile and when the sign-in happened, as
// one JSON object in localStorage (see SESSION_STORAGE_KEY)
export interface AppSession extends AuthProfile {
  // Date.now() at the successful sign-in. Never moved: the session lasts a
  // fixed time from it.
  readonly authenticatedAt: number;
}

// What the stored value turned out to be
export enum StoredSessionState {
  // Nothing stored, or storage the browser does not allow
  None = 'none',
  // Not JSON, or without the fields of a session
  Invalid = 'invalid',
  Expired = 'expired',
  Active = 'active',
}

export type StoredSession =
  | { readonly state: StoredSessionState.None | StoredSessionState.Invalid }
  | {
      readonly state: StoredSessionState.Expired | StoredSessionState.Active;
      readonly session: AppSession;
    };

// Why a session ended
export enum SessionEndReason {
  Logout = 'logout',
  Expired = 'expired',
  Invalid = 'invalid',
}
