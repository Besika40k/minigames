import { createAuthDialog } from '../components/auth-dialog/auth-dialog.ts';
import { createBurgerMenu } from '../components/burger-menu/burger-menu.ts';
import { createFooter } from '../components/footer/footer.ts';
import { createGameDetailsDialog } from '../components/game-details-dialog/game-details-dialog.ts';
import { createHeader, type Header } from '../components/header/header.ts';
import { PAGE_TITLES } from '../data/pages.ts';
import { renderHomePage } from '../pages/home/home-page.ts';
import { renderLibraryPage } from '../pages/library/library-page.ts';
import { renderNotFoundPage } from '../pages/not-found/not-found-page.ts';
import type { AuthDialog, AuthMode } from '../types/auth.ts';
import type { BurgerMenu } from '../types/burger-menu.ts';
import type { Game } from '../types/game.ts';
import type { GameDetailsDialog } from '../types/game-details.ts';
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
import { Router } from './router.ts';
import { parseDialog, removeUnusedDialogParameters } from './url.ts';

export function startApp(): void {
  // A dialog opens over the page in a new history entry, so Back closes it
  const openDialog = (parameter: DialogParameter, value: string): void => {
    const query: URLSearchParams = new URLSearchParams(router.location.query);
    query.set(parameter, value);
    router.navigate({ query }, { state: { isDialogEntry: true } });
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
    router.navigate({ query }, { isReplace: true });
  };

  const authDialog: AuthDialog = createAuthDialog({
    onClose: (): void => {
      closeDialog(DialogParameter.Auth);
    },
  });
  const openAuth = (mode: AuthMode): void => {
    openDialog(DialogParameter.Auth, mode);
  };
  const header: Header = createHeader({ onAuthClick: openAuth });
  const menu: BurgerMenu = createBurgerMenu({
    trigger: header.menuButton,
    onAuthClick: openAuth,
  });

  const gameDetails: GameDetailsDialog = createGameDetailsDialog({
    onClose: (): void => {
      closeDialog(DialogParameter.Game);
    },
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
    header.setCurrentPage(location.route);
    menu.setCurrentPage(location.route);
    // The menu is not in the address, so a new address (for example the
    // browser's Back button) closes it
    menu.element.close();

    // A dialog parameter that opens nothing leaves the address, which then
    // comes back here without it
    const dialog: OpenDialog | undefined = parseDialog(location.query);
    const query: URLSearchParams | undefined = removeUnusedDialogParameters(location.query, dialog);
    if (query !== undefined) {
      router.navigate({ query }, { isReplace: true });
      return;
    }
    showDialog(dialog);
  });
  router.start();
}
