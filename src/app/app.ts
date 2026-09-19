import { createHeader } from '../components/header/header.ts';
import { renderHomePage } from '../pages/home/home-page.ts';
import { renderNotFoundPage } from '../pages/not-found/not-found-page.ts';
import { Route, type RouteDefinition } from '../types/route.ts';
import { createElement } from '../utils/create-element.ts';
import { Router } from './router.ts';

export function startApp(): void {
  const header: HTMLElement = createHeader();
  const main: HTMLElement = createElement('main');
  document.body.append(header, main);

  const routes: readonly RouteDefinition[] = [{ path: Route.Home, render: renderHomePage }];
  const router: Router = new Router(routes, main, renderNotFoundPage);
  router.start();
}
