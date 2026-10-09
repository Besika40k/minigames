import { showSnackbar } from '../components/snackbar/snackbar.ts';
import {
  AUTH_ERROR_MESSAGES,
  AUTH_SUCCESS_MESSAGES,
  GOOGLE_SUCCESS_MESSAGE,
} from '../data/auth.ts';
import { AuthMode, type AuthProfile, type AuthRequest } from '../types/auth.ts';
import { SnackbarVariant, type SnackbarMessage } from '../types/feedback.ts';
import type { AppSession } from '../types/session.ts';
import type { SessionStore } from './session-store.ts';

// The auth service, which brings Firebase with it
export type AuthService = typeof import('./auth-service.ts');

export interface AuthActionsOptions {
  readonly session: SessionStore;
  // Loads the auth service on first use, so a guest never downloads Firebase
  readonly loadService: () => Promise<AuthService>;
  // Runs once a session has started: the auth dialog closes
  readonly onSignedIn: (session: AppSession) => void;
}

export interface AuthActions {
  // Signs in or up with the values of a valid form. Resolves once the outcome
  // is shown; a failure leaves the visitor as a guest, free to try again.
  readonly submit: (request: AuthRequest) => Promise<void>;
  // Signs in through Google's window, with the same outcomes. Closing the
  // window is not an error.
  readonly signInWithGoogle: () => Promise<void>;
}

// The message of a service that could not load. Offline, the connection is to
// blame. Online, a newer deploy of the app has replaced the file this page
// asks for, and only a reload brings the page up to date.
function getLoadFailureText(): string {
  return navigator.onLine
    ? AUTH_ERROR_MESSAGES.outdated
    : (AUTH_ERROR_MESSAGES.byCode['auth/network-request-failed'] ?? AUTH_ERROR_MESSAGES.unknown);
}

// The message of a failure: the service explains its own errors, and a
// closed Google window is only news
function getFailureMessage(error: unknown, service: AuthService | undefined): SnackbarMessage {
  if (service === undefined) {
    return { variant: SnackbarVariant.Error, text: getLoadFailureText() };
  }
  const failure: InstanceType<AuthService['AuthServiceError']> =
    error instanceof service.AuthServiceError ? error : service.toAuthServiceError(error);
  const isCanceled: boolean = failure.kind === service.AuthErrorKind.Canceled;

  return {
    variant: isCanceled ? SnackbarVariant.Info : SnackbarVariant.Error,
    text: failure.message,
  };
}

export function createAuthActions(options: AuthActionsOptions): AuthActions {
  // A successful sign-in starts the app session, closes the dialog and greets
  // the visitor by name. Any failure is one message.
  const run = async (
    greeting: string,
    operation: (service: AuthService) => Promise<AuthProfile>,
  ): Promise<void> => {
    let service: AuthService | undefined;
    try {
      service = await options.loadService();
      const profile: AuthProfile = await operation(service);
      const session: AppSession = options.session.start(profile);
      options.onSignedIn(session);
      showSnackbar({
        variant: SnackbarVariant.Success,
        text: `${greeting}, ${session.displayName}!`,
      });
    } catch (error: unknown) {
      showSnackbar(getFailureMessage(error, service));
    }
  };

  return {
    submit: async (request: AuthRequest): Promise<void> => {
      await run(
        AUTH_SUCCESS_MESSAGES[request.mode],
        async (service: AuthService): Promise<AuthProfile> =>
          request.mode === AuthMode.Register
            ? service.registerWithEmail(request.username, request.email, request.password)
            : service.signInWithEmail(request.email, request.password),
      );
    },
    signInWithGoogle: async (): Promise<void> => {
      await run(GOOGLE_SUCCESS_MESSAGE, async (service: AuthService): Promise<AuthProfile> =>
        service.signInWithGoogle(),
      );
    },
  };
}
