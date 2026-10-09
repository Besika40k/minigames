import { getRouteHref } from '../../app/router.ts';
import { NAVIGATION_LINKS } from '../../data/navigation.ts';
import { AuthMode } from '../../types/auth.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type { NavigationLink } from '../../types/navigation.ts';
import { Route } from '../../types/route.ts';
import type { AppSession } from '../../types/session.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import type { PageLinks } from '../../utils/page-links.ts';
import { createButton } from '../button/button.ts';
import { createLogo } from '../logo/logo.ts';
import { createProfileSummary } from '../profile/profile.ts';

export interface MenuContent {
  readonly elements: readonly HTMLElement[];
  // Shows the profile of a signed-in user in place of the guest buttons
  readonly setSession: (session: AppSession | undefined) => void;
}

interface MenuActions {
  readonly element: HTMLElement;
  readonly setSession: (session: AppSession | undefined) => void;
}

export interface MenuContentHandlers {
  readonly onClose: () => void;
  readonly onLinkClick: () => void;
  readonly onAuthClick: (mode: AuthMode) => void;
}

function createTop(handlers: MenuContentHandlers): HTMLElement {
  const logo: HTMLAnchorElement = createLogo({ className: 'mobile-menu__logo' });
  logo.addEventListener('click', handlers.onLinkClick);

  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'mobile-menu__close',
    attributes: { type: 'button', 'aria-label': 'Close menu', autofocus: '' },
    children: [createIcon(IconName.Close)],
  });
  closeButton.addEventListener('click', handlers.onClose);

  return createElement('div', { className: 'mobile-menu__top', children: [logo, closeButton] });
}

function createLinkItem(
  link: NavigationLink,
  handlers: MenuContentHandlers,
  pageLinks: PageLinks,
): HTMLLIElement {
  const anchor: HTMLAnchorElement = createElement('a', {
    className: 'mobile-menu__link',
    text: link.label,
    attributes: { href: getRouteHref(link.page ?? Route.Home) },
  });
  anchor.addEventListener('click', handlers.onLinkClick);
  if (link.page !== undefined) {
    pageLinks.add(anchor, link.page);
  }

  return createElement('li', { children: [anchor] });
}

function createNavigation(handlers: MenuContentHandlers, pageLinks: PageLinks): HTMLElement {
  const items: HTMLLIElement[] = NAVIGATION_LINKS.map((link: NavigationLink): HTMLLIElement =>
    createLinkItem(link, handlers, pageLinks),
  );

  return createElement('nav', {
    className: 'mobile-menu__nav',
    attributes: { 'aria-label': 'Mobile navigation' },
    children: [createElement('ul', { className: 'mobile-menu__list', children: items })],
  });
}

function createActions(handlers: MenuContentHandlers): MenuActions {
  const logIn: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Medium,
    text: 'Log In',
    onClick: (): void => {
      handlers.onAuthClick(AuthMode.Login);
    },
  });

  const signUp: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    text: 'Sign Up',
    onClick: (): void => {
      handlers.onAuthClick(AuthMode.Register);
    },
  });

  const guestButtons: HTMLButtonElement[] = [logIn, signUp];
  const element: HTMLElement = createElement('div', {
    className: 'mobile-menu__actions',
    children: guestButtons,
  });

  return {
    element,
    setSession: (session: AppSession | undefined): void => {
      element.replaceChildren(
        ...(session === undefined
          ? guestButtons
          : [createProfileSummary(session, 'mobile-menu__profile')]),
      );
    },
  };
}

export function createMenuContent(
  handlers: MenuContentHandlers,
  pageLinks: PageLinks,
): MenuContent {
  const actions: MenuActions = createActions(handlers);

  return {
    elements: [createTop(handlers), createNavigation(handlers, pageLinks), actions.element],
    setSession: actions.setSession,
  };
}
