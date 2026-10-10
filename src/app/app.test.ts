import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STORAGE_KEY } from '../auth/session.ts';
import { showSnackbar } from '../components/snackbar/snackbar.ts';
import { ALREADY_SIGNED_IN_MESSAGE, SESSION_EXPIRED_MESSAGE } from '../data/auth.ts';
import { SnackbarVariant } from '../types/feedback.ts';
import { startApp } from './app.ts';

vi.mock('../components/snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));
// Firebase stays out of the tests: the app loads the auth service only to
// sign in and out
vi.mock('../auth/auth-service.ts', () => ({ signOutUser: vi.fn() }));

const SESSION_LIFETIME: number = 5 * 60 * 1000;

// The pages keep loading: these tests are about the dialogs
function stubPendingFetch(): void {
  const pending: Promise<Response> = new Promise<Response>((): void => {
    // Never settles
  });
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(pending));
}

// An address reached the way Back and Forward reach one
function visit(url: string): void {
  globalThis.history.pushState({}, '', url);
  globalThis.dispatchEvent(new PopStateEvent('popstate'));
}

function saveSession(authenticatedAt: number): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ displayName: 'Alex Pro', email: 'alex@minigames.com', authenticatedAt }),
  );
}

function getAddress(): string {
  const { pathname, search, hash } = globalThis.location;

  return `${pathname}${search}${hash}`;
}

function isOpen(selector: string): boolean {
  return document.querySelector<HTMLDialogElement>(selector)?.open === true;
}

function pressEscape(selector: string): void {
  document
    .querySelector(selector)
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

// The app adds its listeners to the whole window, so one app serves every test
beforeAll((): void => {
  stubPendingFetch();
  startApp();
});

beforeEach((): void => {
  stubPendingFetch();
  localStorage.clear();
  visit('/');
  vi.clearAllMocks();
});

describe('auth dialog address for a guest', (): void => {
  it('opens the auth dialog and closes it by taking it out of the address', (): void => {
    visit('/library?auth=login');

    expect(isOpen('.auth-dialog')).toBe(true);

    pressEscape('.auth-dialog');

    expect(isOpen('.auth-dialog')).toBe(false);
    expect(getAddress()).toBe('/library');
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('shows the auth dialog over a game and the game again when it closes', (): void => {
    visit('/?game=chess&auth=login');

    expect(isOpen('.auth-dialog')).toBe(true);
    expect(isOpen('.game-details')).toBe(false);
    expect(getAddress()).toBe('/?game=chess&auth=login');

    pressEscape('.auth-dialog');

    expect(isOpen('.auth-dialog')).toBe(false);
    expect(isOpen('.game-details')).toBe(true);
    expect(getAddress()).toBe('/?game=chess');
  });

  it('opens the auth dialog once an expired session has ended', (): void => {
    saveSession(Date.now() - SESSION_LIFETIME - 1000);

    visit('/?auth=register');

    expect(isOpen('.auth-dialog')).toBe(true);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: SESSION_EXPIRED_MESSAGE,
    });
  });
});

describe('auth dialog address for a signed-in user', (): void => {
  it('removes only the auth parameter, in place, with one message', (): void => {
    saveSession(Date.now());
    const length: number = globalThis.history.length;

    visit('/library?page=2&auth=register#top');

    expect(getAddress()).toBe('/library?page=2#top');
    // The visit added one entry; the cleaned address replaced it
    expect(globalThis.history.length).toBe(length + 1);
    expect(isOpen('.auth-dialog')).toBe(false);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Info,
      text: ALREADY_SIGNED_IN_MESSAGE,
    });
  });

  it('shows the game the auth dialog was asked over', (): void => {
    saveSession(Date.now());

    visit('/?game=chess&auth=login');

    expect(getAddress()).toBe('/?game=chess');
    expect(isOpen('.game-details')).toBe(true);
    expect(isOpen('.auth-dialog')).toBe(false);
    expect(showSnackbar).toHaveBeenCalledOnce();
  });

  it('keeps a guest button from opening the auth dialog', (): void => {
    // Signed in from another tab, before this tab has heard of it
    saveSession(Date.now());
    const length: number = globalThis.history.length;

    document.querySelector<HTMLButtonElement>('.header__auth-button--log-in')?.click();

    expect(getAddress()).toBe('/');
    expect(globalThis.history.length).toBe(length);
    expect(isOpen('.auth-dialog')).toBe(false);
    expect(document.querySelector('.header__profile')).not.toBeNull();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Info,
      text: ALREADY_SIGNED_IN_MESSAGE,
    });
  });
});
