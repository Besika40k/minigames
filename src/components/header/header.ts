import { getRouteHref } from '../../app/router.ts';
import { NAVIGATION_LINKS } from '../../data/navigation.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type { NavigationLink } from '../../types/navigation.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { createButton } from '../button/button.ts';
import { createLogo } from '../logo/logo.ts';
import './header.scss';

export interface HeaderOptions {
  readonly onAuthClick?: () => void;
}

export interface Header {
  readonly element: HTMLElement;
  readonly menuButton: HTMLButtonElement;
}

function createNavigationItem(link: NavigationLink): HTMLLIElement {
  const classNames: string[] = ['header__nav-link'];
  const attributes: Record<string, string> = { href: getRouteHref(link.route) };
  if (link.isCurrent) {
    classNames.push('header__nav-link--current');
    attributes['aria-current'] = 'page';
  }

  return createElement('li', {
    children: [
      createElement('a', { className: classNames.join(' '), text: link.label, attributes }),
    ],
  });
}

function createNavigation(): HTMLElement {
  const items: HTMLLIElement[] = NAVIGATION_LINKS.map((link: NavigationLink): HTMLLIElement =>
    createNavigationItem(link),
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
    onClick: options.onAuthClick,
  });

  const signUp: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    text: 'Sign Up',
    className: 'header__auth-button header__auth-button--sign-up',
    onClick: options.onAuthClick,
  });

  return createElement('div', {
    className: 'header__actions',
    children: [logIn, signUp, menuButton],
  });
}

export function createHeader(options: HeaderOptions = {}): Header {
  const menuButton: HTMLButtonElement = createMenuButton();

  const element: HTMLElement = createElement('header', {
    className: 'header',
    children: [
      createElement('div', {
        className: 'header__inner',
        children: [
          createLogo({ className: 'header__logo' }),
          createNavigation(),
          createActions(options, menuButton),
        ],
      }),
    ],
  });

  return { element, menuButton };
}
