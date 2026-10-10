import { createAuthActions, type AuthActions, type AuthService } from '../auth/auth-actions.ts';
import { SESSION_STORAGE_KEY } from '../auth/session.ts';
import { createSessionStore, type SessionStore } from '../auth/session-store.ts';
import { createAuthDialog } from '../components/auth-dialog/auth-dialog.ts';
import { createBurgerMenu } from '../components/burger-menu/burger-menu.ts';
import { createFooter } from '../components/footer/footer.ts';
import { createGameDetailsDialog } from '../components/game-details-dialog/game-details-dialog.ts';
import { createHeader, type Header } from '../components/header/header.ts';
import { showSnackbar } from '../components/snackbar/snackbar.ts';
import { ALREADY_SIGNED_IN_MESSAGE, SESSION_EXPIRED_MESSAGE } from '../data/auth.ts';
import { PAGE_TITLES } from '../data/pages.ts';
import { renderHomePage } from '../pages/home/home-page.ts';
import { renderLibraryPage } from '../pages/library/library-page.ts';
import { renderNotFoundPage } from '../pages/not-found/not-found-page.ts';
import { AuthMode, type AuthDialog } from '../types/auth.ts';
import type { BurgerMenu } from '../types/burger-menu.ts';
import { SnackbarVariant } from '../types/feedback.ts';
import type { Game } from '../types/game.ts';
import type { GameDetailsDialog } from '../types/game-details.ts';
import type { AppSession } from '../types/session.ts';
import {
  DialogParameter,
  Route,
  type AppLocation,
  type OpenDialog,
  type PageDefinition,
  type PageView,
  type RouteDefinition,
} from '../types/route.ts';
import { createElement } from '../utils/create-element.ts';
import { Router, type NavigationOptions } from './router.ts';
import { decideDialog, type DialogDecision } from './url.ts';

// The auth service brings Firebase with it, so it loads only when it is
// needed, and a guest's visit never downloads it
async function loadAuthService(): Promise<AuthService> {
  return import('../auth/auth-service.ts');
}

// Google's window may only open right after a click, so the auth service
// starts loading as soon as the auth dialog opens and is ready by then
async function preloadAuthService(): Promise<void> {
  try {
    await loadAuthService();
  } catch {
    // A sign-in reports a service that cannot load
  }
}

// Why the auth dialog did not open
function showAlreadySignedIn(): void {
  showSnackbar({ variant: SnackbarVariant.Info, text: ALREADY_SIGNED_IN_MESSAGE });
}

export function startApp(): void {
  // How many sessions have expired, so a protected action can tell whether its
  // own check has just said so
  const expiries: { count: number } = { count: 0 };

  // Whether the visitor is signed in
  const session: SessionStore = createSessionStore({
    signOut: async (): Promise<void> => {
      const { signOutUser } = await loadAuthService();
      await signOutUser();
    },
    onExpire: (): void => {
      expiries.count += 1;
      showSnackbar({ variant: SnackbarVariant.Warning, text: SESSION_EXPIRED_MESSAGE });
    },
  });

  // The dialogs live in the query: the path and the hash of the page stay
  const changeQuery = (query: URLSearchParams, options: NavigationOptions): void => {
    router.navigate({ query, hash: router.location.hash }, options);
  };

  // A dialog opens over the page in a new history entry, so Back closes it
  const openDialog = (parameter: DialogParameter, value: string): void => {
    const query: URLSearchParams = new URLSearchParams(router.location.query);
    query.set(parameter, value);
    changeQuery(query, { state: { isDialogEntry: true } });
  };

  // A dialog kept in the address closes by leaving the history entry that
  // opened it, or, when the address came in with the dialog open (a deep
  // link), by taking its parameter out of the address
  const closeDialog = (parameter: DialogParameter): void => {
    if (router.isDialogEntry) {
      router.back();
      return;
    }
    const query: URLSearchParams = new URLSearchParams(router.location.query);
    query.delete(parameter);
    changeQuery(query, { isReplace: true });
  };

  const authActions: AuthActions = createAuthActions({
    session,
    loadService: loadAuthService,
    // The dialog closes like any other close, unless the visitor has already
    // left it, for example with Back
    onSignedIn: (): void => {
      if (router.location.query.has(DialogParameter.Auth)) {
        closeDialog(DialogParameter.Auth);
      }
    },
  });

  const authDialog: AuthDialog = createAuthDialog({
    onClose: (): void => {
      closeDialog(DialogParameter.Auth);
    },
    onSubmit: authActions.submit,
    onGoogle: authActions.signInWithGoogle,
    // Another form changes the mode in the address without a new history
    // entry, so Back still closes the dialog at once
    onModeChange: (mode: AuthMode): void => {
      const query: URLSearchParams = new URLSearchParams(router.location.query);
      query.set(DialogParameter.Auth, mode);
      changeQuery(query, { isReplace: true });
    },
  });
  // The auth dialog is for guests. A guest button may still be on the screen
  // of a user who has just signed in from another tab.
  const openAuth = (mode: AuthMode): void => {
    if (session.check() !== undefined) {
      showAlreadySignedIn();
      return;
    }
    openDialog(DialogParameter.Auth, mode);
  };
  const logOut = (): void => {
    void authActions.logOut();
  };
  const header: Header = createHeader({ onAuthClick: openAuth, onLogout: logOut });
  const menu: BurgerMenu = createBurgerMenu({
    trigger: header.menuButton,
    onAuthClick: openAuth,
    onLogout: logOut,
  });
  // The header and the menu show the signed-in profile or the guest buttons
  session.subscribe((current: AppSession | undefined): void => {
    header.setSession(current);
    menu.setSession(current);
  });

  // A change such as a favorite needs an active session. Without one, the auth
  // dialog takes the place of Game Details, whose game stays in the address
  // and comes back when the auth dialog closes. One warning says why: the
  // expiry message when this check has just ended the session. The change is
  // not repeated after a sign-in; the user can make it again.
  const requireSession = (warning: string): AppSession | undefined => {
    const expiredBefore: number = expiries.count;
    const current: AppSession | undefined = session.check();
    if (current === undefined) {
      if (expiries.count === expiredBefore) {
        showSnackbar({ variant: SnackbarVariant.Warning, text: warning });
      }
      openDialog(DialogParameter.Auth, AuthMode.Login);
    }

    return current;
  };

  const gameDetails: GameDetailsDialog = createGameDetailsDialog({
    onClose: (): void => {
      closeDialog(DialogParameter.Game);
    },
    getSession: session.getCurrent,
    requireSession,
  });
  // Game Details shows the favorite of whoever is signed in, or none for a guest
  session.subscribe((): void => {
    gameDetails.refresh();
  });
  const openGame = (game: Game): void => {
    openDialog(DialogParameter.Game, game.slug);
  };

  // The dialogs follow the address: the one it names is open, the other closed
  const showDialog = (dialog: OpenDialog | undefined): void => {
    switch (dialog?.parameter) {
      case DialogParameter.Game: {
        authDialog.hide();
        gameDetails.show(dialog.slug);
        break;
      }
      case DialogParameter.Auth: {
        gameDetails.hide();
        authDialog.show(dialog.mode);
        void preloadAuthService();
        break;
      }
      default: {
        gameDetails.hide();
        authDialog.hide();
      }
    }
  };

  const main: HTMLElement = createElement('main');
  document.body.append(
    header.element,
    main,
    createFooter(),
    menu.element,
    authDialog.element,
    gameDetails.element,
  );

  const routes: readonly RouteDefinition[] = [
    {
      path: Route.Home,
      title: PAGE_TITLES.home,
      render: (): PageView => renderHomePage({ onGameOpen: openGame }),
    },
    {
      path: Route.Library,
      title: PAGE_TITLES.library,
      render: (location: AppLocation): PageView =>
        renderLibraryPage(location, {
          onGameOpen: openGame,
          onNavigate: (query: URLSearchParams, isReplace: boolean): void => {
            router.navigate({ query }, { isReplace });
          },
        }),
    },
  ];
  const notFound: PageDefinition = {
    title: PAGE_TITLES.notFound,
    render: (): PageView => ({ elements: renderNotFoundPage() }),
  };
  const router: Router = new Router(routes, notFound, main);
  router.onChange((location: AppLocation): void => {
    // An expired session ends before a dialog of the new address shows, and
    // the navigation goes on in guest mode
    const current: AppSession | undefined = session.check();
    header.setCurrentPage(location.route);
    menu.setCurrentPage(location.route);
    // The menu is not in the address, so a new address (for example the
    // browser's Back button) closes it
    menu.element.close();

    // A dialog parameter that opens nothing leaves the address, which then
    // comes back here without it. For a signed-in user that includes the
    // auth dialog, whatever asked for it: a link, a typed address or Back.
    const decision: DialogDecision = decideDialog(location.query, current !== undefined);
    if (decision.isAuthBlocked) {
      showAlreadySignedIn();
    }
    if (decision.correctedQuery !== undefined) {
      changeQuery(decision.correctedQuery, { isReplace: true });
      return;
    }
    showDialog(decision.dialog);
  });

  // Timers run late in a hidden tab, so a session may have expired by the
  // time the visitor comes back. Another tab may also sign in or out.
  document.addEventListener('visibilitychange', (): void => {
    if (document.visibilityState === 'visible') {
      session.check();
    }
  });
  globalThis.addEventListener('storage', (event: StorageEvent): void => {
    // A key of null means the other tab cleared all of the site's storage
    if ((event.key ?? SESSION_STORAGE_KEY) === SESSION_STORAGE_KEY) {
      session.check();
    }
  });

  // The stored session is checked once at startup, before the first page shows
  session.check();
  router.start();
}
