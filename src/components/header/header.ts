import { getRouteHref } from '../../app/router.ts';
import { NAVIGATION_LINKS } from '../../data/navigation.ts';
import { AuthMode } from '../../types/auth.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type { NavigationLink } from '../../types/navigation.ts';
import { Route } from '../../types/route.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { PageLinks } from '../../utils/page-links.ts';
import { createButton } from '../button/button.ts';
import { createLogo } from '../logo/logo.ts';
import './header.scss';

export interface HeaderOptions {
  // Log In asks for the login form and Sign Up for the registration form
  readonly onAuthClick?: (mode: AuthMode) => void;
}

export interface Header {
  readonly element: HTMLElement;
  readonly menuButton: HTMLButtonElement;
  // Marks the navigation link of the open page
  readonly setCurrentPage: (page: Route | undefined) => void;
}

function createNavigationItem(link: NavigationLink, pageLinks: PageLinks): HTMLLIElement {
  const anchor: HTMLAnchorElement = createElement('a', {
    className: 'header__nav-link',
    text: link.label,
    attributes: { href: getRouteHref(link.page ?? Route.Home) },
  });
  if (link.page !== undefined) {
    pageLinks.add(anchor, link.page);
  }

  return createElement('li', { children: [anchor] });
}

function createNavigation(pageLinks: PageLinks): HTMLElement {
  const items: HTMLLIElement[] = NAVIGATION_LINKS.map((link: NavigationLink): HTMLLIElement =>
    createNavigationItem(link, pageLinks),
  );

  return createElement('nav', {
    className: 'header__nav',
    attributes: { 'aria-label': 'Main navigation' },
    children: [createElement('ul', { className: 'header__nav-list', children: items })],
  });
}

function createMenuButton(): HTMLButtonElement {
  return createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Icon,
    label: 'Open menu',
    className: 'header__burger',
    children: [createIcon(IconName.Burger)],
  });
}

function createActions(options: HeaderOptions, menuButton: HTMLButtonElement): HTMLElement {
  const logIn: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Medium,
    text: 'Log In',
    className: 'header__auth-button header__auth-button--log-in',
    onClick: (): void => {
      options.onAuthClick?.(AuthMode.Login);
    },
  });

  const signUp: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    text: 'Sign Up',
    className: 'header__auth-button header__auth-button--sign-up',
    onClick: (): void => {
      options.onAuthClick?.(AuthMode.Register);
    },
  });

  return createElement('div', {
    className: 'header__actions',
    children: [logIn, signUp, menuButton],
  });
}

export function createHeader(options: HeaderOptions = {}): Header {
  const menuButton: HTMLButtonElement = createMenuButton();
  const pageLinks: PageLinks = new PageLinks();

  const element: HTMLElement = createElement('header', {
    className: 'header',
    children: [
      createElement('div', {
        className: 'header__inner',
        children: [
          createLogo({ className: 'header__logo' }),
          createNavigation(pageLinks),
          createActions(options, menuButton),
        ],
      }),
    ],
  });

  return {
    element,
    menuButton,
    setCurrentPage: (page: Route | undefined): void => {
      pageLinks.markCurrent(page);
    },
  };
}
