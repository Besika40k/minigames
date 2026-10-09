import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthMode } from '../../types/auth.ts';
import type { BurgerMenu } from '../../types/burger-menu.ts';
import { Route } from '../../types/route.ts';
import type { AppSession } from '../../types/session.ts';
import { createBurgerMenu } from './burger-menu.ts';

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 9),
};

interface TestMenu {
  readonly menu: BurgerMenu;
  readonly trigger: HTMLButtonElement;
  readonly onAuthClick: Mock<(mode: AuthMode) => void>;
}

function renderMenu(): TestMenu {
  const trigger: HTMLButtonElement = document.createElement('button');
  const onAuthClick: Mock<(mode: AuthMode) => void> = vi.fn<(mode: AuthMode) => void>();
  const menu: BurgerMenu = createBurgerMenu({ trigger, onAuthClick });
  document.body.append(trigger, menu.element);

  return { menu, trigger, onAuthClick };
}

function getActionTexts(menu: BurgerMenu): string[] {
  return [...menu.element.querySelectorAll(':scope .mobile-menu__actions button')].map(
    (button: Element): string => button.textContent,
  );
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('burger menu', (): void => {
  it('opens from its button and closes with Esc', (): void => {
    const { menu, trigger } = renderMenu();

    trigger.click();
    expect(menu.element.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    menu.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.element.open).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes before it asks for a form', (): void => {
    const { menu, trigger, onAuthClick } = renderMenu();
    trigger.click();

    menu.element.querySelector<HTMLButtonElement>(':scope .mobile-menu__actions button')?.click();

    expect(menu.element.open).toBe(false);
    expect(onAuthClick).toHaveBeenCalledExactlyOnceWith(AuthMode.Login);
  });

  it('marks the link of the open page', (): void => {
    const { menu } = renderMenu();

    menu.setCurrentPage(Route.Home);

    expect(menu.element.querySelector('[aria-current="page"]')?.textContent).toBe('Home');
  });

  it('shows the profile in place of the guest buttons while signed in, and back', (): void => {
    const { menu } = renderMenu();

    menu.setSession(SESSION);
    expect(getActionTexts(menu)).toEqual([]);
    expect(menu.element.querySelector('.mobile-menu__profile')?.textContent).toBe('APAlex Pro');

    menu.setSession(undefined);
    expect(getActionTexts(menu)).toEqual(['Log In', 'Sign Up']);
    expect(menu.element.querySelector('.mobile-menu__profile')).toBeNull();
  });
});
