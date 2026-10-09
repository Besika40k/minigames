import { showSnackbar } from '../components/snackbar/snackbar.ts';
import { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '../data/auth.ts';
import { AuthMode, type AuthProfile, type AuthRequest } from '../types/auth.ts';
import { SnackbarVariant } from '../types/feedback.ts';
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
}

// The message of a failure: the service explains its own errors, and a
// service that could not even load means no connection
function getFailureMessage(error: unknown, service: AuthService | undefined): string {
  if (service === undefined) {
    return AUTH_ERROR_MESSAGES.byCode['auth/network-request-failed'] ?? AUTH_ERROR_MESSAGES.unknown;
  }

  return error instanceof service.AuthServiceError
    ? error.message
    : service.toAuthServiceError(error).message;
}

export function createAuthActions(options: AuthActionsOptions): AuthActions {
  // A successful sign-in starts the app session, closes the dialog and greets
  // the visitor by name. Any failure is one error message.
  const run = async (
    mode: AuthMode,
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
        text: `${AUTH_SUCCESS_MESSAGES[mode]}, ${session.displayName}!`,
      });
    } catch (error: unknown) {
      showSnackbar({ variant: SnackbarVariant.Error, text: getFailureMessage(error, service) });
    }
  };

  return {
    submit: async (request: AuthRequest): Promise<void> => {
      await run(request.mode, async (service: AuthService): Promise<AuthProfile> =>
        request.mode === AuthMode.Register
          ? service.registerWithEmail(request.username, request.email, request.password)
          : service.signInWithEmail(request.email, request.password),
      );
    },
  };
}
