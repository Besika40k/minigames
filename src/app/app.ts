import { createAuthDialog } from '../components/auth-dialog/auth-dialog.ts';
import { createBurgerMenu } from '../components/burger-menu/burger-menu.ts';
import { createFooter } from '../components/footer/footer.ts';
import { createGameDetailsDialog } from '../components/game-details-dialog/game-details-dialog.ts';
import { createHeader, type Header } from '../components/header/header.ts';
import { PAGE_TITLES } from '../data/pages.ts';
import { renderHomePage } from '../pages/home/home-page.ts';
import { renderLibraryPage } from '../pages/library/library-page.ts';
import { renderNotFoundPage } from '../pages/not-found/not-found-page.ts';
import type { AuthDialog } from '../types/auth.ts';
import type { BurgerMenu } from '../types/burger-menu.ts';
import type { Game } from '../types/game.ts';
import type { GameDetailsDialog } from '../types/game-details.ts';
import {
  DialogParameter,
  Route,
  type AppLocation,
  type PageDefinition,
  type PageView,
  type RouteDefinition,
} from '../types/route.ts';
import { createElement } from '../utils/create-element.ts';
import { Router } from './router.ts';

export function startApp(): void {
  const authDialog: AuthDialog = createAuthDialog();
  const header: Header = createHeader({ onAuthClick: authDialog.open });
  const menu: BurgerMenu = createBurgerMenu({
    trigger: header.menuButton,
    onAuthClick: authDialog.open,
  });

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

  const gameDetails: GameDetailsDialog = createGameDetailsDialog({
    onClose: (): void => {
      closeDialog(DialogParameter.Game);
    },
  });

  // A game opens over the page in a new history entry, so Back closes it
  const openGame = (game: Game): void => {
    const query: URLSearchParams = new URLSearchParams(router.location.query);
    query.set(DialogParameter.Game, game.slug);
    router.navigate({ query }, { state: { isDialogEntry: true } });
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
    // The menu and the auth dialog are not in the address, so a new address
    // (for example the browser's Back button) closes them
    menu.element.close();
    authDialog.element.close();

    // The game dialog follows the address: open with its game, or closed
    const slug: string = location.query.get(DialogParameter.Game) ?? '';
    if (slug === '') {
      gameDetails.hide();
      return;
    }
    gameDetails.show(slug);
  });
  router.start();
}
