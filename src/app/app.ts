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
import type { GameDetailsDialog } from '../types/game-details.ts';
import {
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
  const gameDetails: GameDetailsDialog = createGameDetailsDialog();
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
      render: (): PageView => renderHomePage({ onGameOpen: gameDetails.open }),
    },
    {
      path: Route.Library,
      title: PAGE_TITLES.library,
      render: (): PageView => ({ elements: renderLibraryPage({ onGameOpen: gameDetails.open }) }),
    },
  ];
  const notFound: PageDefinition = {
    title: PAGE_TITLES.notFound,
    render: (): PageView => ({ elements: renderNotFoundPage() }),
  };
  // A dialog belongs to the page it was opened on, so it closes when the
  // address changes under it (for example with the browser's Back button)
  const dialogs: readonly HTMLDialogElement[] = [
    menu.element,
    authDialog.element,
    gameDetails.element,
  ];

  const router: Router = new Router(routes, notFound, main);
  router.onChange((location: AppLocation): void => {
    header.setCurrentPage(location.route);
    menu.setCurrentPage(location.route);
    for (const dialog of dialogs) {
      dialog.close();
    }
  });
  router.start();
}
