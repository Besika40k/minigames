import type { BurgerMenuOptions } from '../../types/burger-menu.ts';
import { createElement } from '../../utils/create-element.ts';
import { isDisplayed } from '../../utils/is-displayed.ts';
import { createMenuContent } from './burger-menu-content.ts';
import './burger-menu.scss';

const MENU_ID = 'mobile-menu';

export function createBurgerMenu(options: BurgerMenuOptions): HTMLDialogElement {
  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'mobile-menu',
    attributes: { id: MENU_ID, 'aria-label': 'Main menu' },
  });

  const closeMenu = (): void => {
    dialog.close();
  };

  dialog.append(
    ...createMenuContent({
      onClose: closeMenu,
      onLinkClick: closeMenu,
      onAuthClick: (): void => {
        closeMenu();
        options.onAuthClick?.();
      },
    }),
  );

  options.trigger.setAttribute('aria-haspopup', 'dialog');
  options.trigger.setAttribute('aria-controls', MENU_ID);
  options.trigger.setAttribute('aria-expanded', 'false');

  options.trigger.addEventListener('click', () => {
    dialog.showModal();
    options.trigger.setAttribute('aria-expanded', 'true');
  });

  // Browsers close a modal dialog on Esc by themselves; handling it here as
  // well keeps that requirement visible and independent of the default
  dialog.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  // The close button, the links, the buttons and the Esc key all end up here
  dialog.addEventListener('close', () => {
    options.trigger.setAttribute('aria-expanded', 'false');
  });

  // The menu is only for tablet and mobile: close it when the window grows
  // past the point where the burger button is hidden
  globalThis.addEventListener('resize', () => {
    if (dialog.open && !isDisplayed(options.trigger)) {
      closeMenu();
    }
  });

  return dialog;
}
