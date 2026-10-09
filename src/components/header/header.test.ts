import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthMode } from '../../types/auth.ts';
import { Route } from '../../types/route.ts';
import type { AppSession } from '../../types/session.ts';
import { createHeader, type Header } from './header.ts';

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 9),
};

function renderHeader(onAuthClick: Mock<(mode: AuthMode) => void> = vi.fn()): Header {
  const header: Header = createHeader({ onAuthClick });
  document.body.append(header.element);

  return header;
}

function getButtonTexts(header: Header): string[] {
  return [...header.element.querySelectorAll(':scope .header__account button')].map(
    (button: Element): string => button.textContent,
  );
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('header', (): void => {
  it('asks for the login and registration forms with its guest buttons', (): void => {
    const onAuthClick: Mock<(mode: AuthMode) => void> = vi.fn<(mode: AuthMode) => void>();
    const header: Header = renderHeader(onAuthClick);
    const [logIn, signUp] = header.element.querySelectorAll<HTMLButtonElement>(
      ':scope .header__account button',
    );

    logIn?.click();
    signUp?.click();

    expect(getButtonTexts(header)).toEqual(['Log In', 'Sign Up']);
    expect(onAuthClick.mock.calls).toEqual([[AuthMode.Login], [AuthMode.Register]]);
  });

  it('marks the link of the open page', (): void => {
    const header: Header = renderHeader();

    header.setCurrentPage(Route.Library);

    const current: Element | null = header.element.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('Library');
  });

  it('shows the profile in place of the guest buttons while signed in', (): void => {
    const header: Header = renderHeader();

    header.setSession(SESSION);

    expect(getButtonTexts(header)).toEqual([]);
    expect(header.element.querySelector('.header__profile')?.textContent).toBe('APAlex Pro');
    // The menu button stays
    expect(header.element.querySelector('.header__burger')).toBe(header.menuButton);
  });

  it('shows the guest buttons again when the session ends', (): void => {
    const header: Header = renderHeader();
    header.setSession(SESSION);

    header.setSession(undefined);

    expect(getButtonTexts(header)).toEqual(['Log In', 'Sign Up']);
    expect(header.element.querySelector('.header__profile')).toBeNull();
  });

  it('shows the photo of a profile that has one', (): void => {
    const header: Header = renderHeader();

    header.setSession({ ...SESSION, avatarUrl: 'https://photo.example/alex.jpg' });

    expect(header.element.querySelector(':scope .header__profile img')?.getAttribute('src')).toBe(
      'https://photo.example/alex.jpg',
    );
  });
});
