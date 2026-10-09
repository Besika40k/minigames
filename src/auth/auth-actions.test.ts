import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { showSnackbar } from '../components/snackbar/snackbar.ts';
import { AUTH_ERROR_MESSAGES } from '../data/auth.ts';
import { AuthMode, type AuthProfile } from '../types/auth.ts';
import { SnackbarVariant } from '../types/feedback.ts';
import type { AppSession } from '../types/session.ts';
import { createAuthActions, type AuthActions, type AuthService } from './auth-actions.ts';
import * as authService from './auth-service.ts';
import { SESSION_STORAGE_KEY } from './session.ts';
import { createSessionStore, type SessionStore } from './session-store.ts';

vi.mock('../components/snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

// The service keeps its real errors; only its Firebase calls are replaced
vi.mock('./auth-service.ts', async (importOriginal: () => Promise<AuthService>) => ({
  ...(await importOriginal()),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
}));

const NOW: number = Date.UTC(2026, 9, 9, 12, 0, 0);

const PROFILE: AuthProfile = { displayName: 'CozyGamer', email: 'cozy@minigames.com' };

interface TestActions {
  readonly actions: AuthActions;
  readonly onSignedIn: Mock<(session: AppSession) => void>;
}

function createTestActions(
  loadService: () => Promise<AuthService> = (): Promise<AuthService> =>
    Promise.resolve(authService),
): TestActions {
  const session: SessionStore = createSessionStore({
    signOut: vi.fn<() => Promise<void>>().mockResolvedValue(),
    onExpire: vi.fn<() => void>(),
  });
  const onSignedIn: Mock<(session: AppSession) => void> = vi.fn<(session: AppSession) => void>();

  return { actions: createAuthActions({ session, loadService, onSignedIn }), onSignedIn };
}

function readStoredSession(): unknown {
  return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null');
}

beforeEach((): void => {
  vi.useFakeTimers({ now: NOW });
  localStorage.clear();
});

afterEach((): void => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('email sign-in', (): void => {
  it('signs in, starts the session, closes the dialog and greets the user', async (): Promise<void> => {
    vi.mocked(authService.signInWithEmail).mockResolvedValue(PROFILE);
    const { actions, onSignedIn } = createTestActions();

    await actions.submit({ mode: AuthMode.Login, email: PROFILE.email, password: 'simple' });

    const session: AppSession = { ...PROFILE, authenticatedAt: NOW };
    expect(authService.signInWithEmail).toHaveBeenCalledExactlyOnceWith(PROFILE.email, 'simple');
    expect(readStoredSession()).toEqual(session);
    expect(onSignedIn).toHaveBeenCalledExactlyOnceWith(session);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Success,
      text: 'Welcome back, CozyGamer!',
    });
  });

  it('registers with the username and greets the new user', async (): Promise<void> => {
    vi.mocked(authService.registerWithEmail).mockResolvedValue(PROFILE);
    const { actions } = createTestActions();

    await actions.submit({
      mode: AuthMode.Register,
      username: 'CozyGamer',
      email: PROFILE.email,
      password: 'Secret1!',
    });

    expect(authService.registerWithEmail).toHaveBeenCalledExactlyOnceWith(
      'CozyGamer',
      PROFILE.email,
      'Secret1!',
    );
    expect(authService.signInWithEmail).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith({
      variant: SnackbarVariant.Success,
      text: 'Welcome to MiniGames, CozyGamer!',
    });
  });

  it('shows the error of a failed sign-in and stays a guest', async (): Promise<void> => {
    vi.mocked(authService.signInWithEmail).mockRejectedValue(
      new authService.AuthServiceError(
        authService.AuthErrorKind.Failed,
        'Wrong email or password.',
        'auth/invalid-credential',
      ),
    );
    const { actions, onSignedIn } = createTestActions();

    await actions.submit({ mode: AuthMode.Login, email: PROFILE.email, password: 'wrong1' });

    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Error,
      text: 'Wrong email or password.',
    });
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('explains an unexpected failure in general words', async (): Promise<void> => {
    vi.mocked(authService.signInWithEmail).mockRejectedValue(new Error('boom'));
    const { actions } = createTestActions();

    await actions.submit({ mode: AuthMode.Login, email: PROFILE.email, password: 'simple' });

    expect(showSnackbar).toHaveBeenCalledWith({
      variant: SnackbarVariant.Error,
      text: AUTH_ERROR_MESSAGES.unknown,
    });
  });

  it('reports no connection when the sign-in part of the app cannot load', async (): Promise<void> => {
    const { actions, onSignedIn } = createTestActions((): Promise<AuthService> =>
      Promise.reject(new TypeError('Failed to fetch dynamically imported module')),
    );

    await actions.submit({ mode: AuthMode.Login, email: PROFILE.email, password: 'simple' });

    expect(showSnackbar).toHaveBeenCalledWith({
      variant: SnackbarVariant.Error,
      text: AUTH_ERROR_MESSAGES.byCode['auth/network-request-failed'],
    });
    expect(onSignedIn).not.toHaveBeenCalled();
  });
});
