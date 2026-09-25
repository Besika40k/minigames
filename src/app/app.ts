import { createAuthDialog } from '../components/auth-dialog/auth-dialog.ts';
import { createBurgerMenu } from '../components/burger-menu/burger-menu.ts';
import { createFooter } from '../components/footer/footer.ts';
import { createHeader, type Header } from '../components/header/header.ts';
import { renderHomePage } from '../pages/home/home-page.ts';
import { renderLibraryPage } from '../pages/library/library-page.ts';
import { renderNotFoundPage } from '../pages/not-found/not-found-page.ts';
import type { AuthDialog } from '../types/auth.ts';
import type { BurgerMenu } from '../types/burger-menu.ts';
import { Route, type RouteDefinition } from '../types/route.ts';
import { createElement } from '../utils/create-element.ts';
import { Router } from './router.ts';

export function startApp(): void {
  const authDialog: AuthDialog = createAuthDialog();
  const header: Header = createHeader({ onAuthClick: authDialog.open });
  const menu: BurgerMenu = createBurgerMenu({
    trigger: header.menuButton,
    onAuthClick: authDialog.open,
  });
  const main: HTMLElement = createElement('main');
  document.body.append(header.element, main, createFooter(), menu.element, authDialog.element);

  const routes: readonly RouteDefinition[] = [
    { path: Route.Home, render: renderHomePage },
    { path: Route.Library, render: renderLibraryPage },
  ];
  const router: Router = new Router(routes, main, renderNotFoundPage);
  router.start((page: Route | undefined): void => {
    header.setCurrentPage(page);
    menu.setCurrentPage(page);
  });
}
