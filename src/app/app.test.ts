import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SESSION_STORAGE_KEY } from '../auth/session.ts';
import { showSnackbar } from '../components/snackbar/snackbar.ts';
import { ALREADY_SIGNED_IN_MESSAGE, SESSION_EXPIRED_MESSAGE } from '../data/auth.ts';
import { GAME_DETAILS_CONTENT } from '../data/game-details.ts';
import { SnackbarVariant } from '../types/feedback.ts';
import { startApp } from './app.ts';

vi.mock('../components/snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));
// Firebase stays out of the tests: the app loads the auth service only to
// sign in and out
vi.mock('../auth/auth-service.ts', () => ({ signOutUser: vi.fn() }));

type FetchMock = Mock<typeof fetch>;

const SESSION_LIFETIME: number = 5 * 60 * 1000;

const NEVER: Promise<Response> = new Promise<Response>((): void => {
  // Never settles
});

// The pages keep loading: these tests are about the dialogs
function stubPendingFetch(): void {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(NEVER));
}

// The game "chess" as the API sends it: a favorite of the user a request names
function createChessAnswer(url: URL): Response {
  return Response.json({
    data: {
      slug: 'chess',
      name: 'Chess',
      heroImage: '/chess.jpg',
      rating: 4.8,
      likesCount: 1200,
      isLikedByCurrentUser: url.searchParams.has('userEmail'),
      fullDescription: 'The classic.',
      specs: { genre: 'Strategy', players: 'Two', duration: '30 min', price: 'Free' },
      topRecords: [],
    },
  });
}

// The API answers for the game "chess" and its comments, which are none; the
// pages keep loading
function stubGameApi(): FetchMock {
  const fetchMock: FetchMock = vi.fn<typeof fetch>(
    (input: URL | RequestInfo): Promise<Response> => {
      const url: URL = input instanceof URL ? input : new URL('about:blank');
      if (url.pathname.endsWith('/games/chess/comments')) {
        return Promise.resolve(Response.json({ data: [], meta: { totalComments: 0 } }));
      }

      return url.pathname.endsWith('/games/chess')
        ? Promise.resolve(createChessAnswer(url))
        : NEVER;
    },
  );
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

// The addresses the app asked the API for, with the method of each request
function getRequests(fetchMock: FetchMock): string[] {
  return fetchMock.mock.calls.map(([input, init]: Parameters<typeof fetch>): string => {
    const url: string = input instanceof URL ? `${input.pathname}${input.search}` : '';

    return `${init?.method ?? 'GET'} ${url}`;
  });
}

// Lets the answers and the history changes arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
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

describe('Game Details and the session', (): void => {
  it('loads the game of a signed-in user with the user named', async (): Promise<void> => {
    saveSession(Date.now());
    const fetchMock: FetchMock = stubGameApi();

    visit('/?game=chess');
    await settle();

    expect(getRequests(fetchMock)).toContain('GET /api/games/chess?userEmail=alex%40minigames.com');
    expect(document.querySelector('.game-details__favorite')?.textContent).toBe(
      GAME_DETAILS_CONTENT.removeFavoriteLabel,
    );
  });

  it('shows the auth dialog in place of the game when a guest adds a favorite', async (): Promise<void> => {
    const fetchMock: FetchMock = stubGameApi();
    visit('/?game=chess');
    await settle();

    document.querySelector<HTMLButtonElement>('.game-details__favorite')?.click();

    expect(getAddress()).toBe('/?game=chess&auth=login');
    expect(isOpen('.auth-dialog')).toBe(true);
    expect(isOpen('.game-details')).toBe(false);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: GAME_DETAILS_CONTENT.favoriteMessages.loginWarning,
    });

    // Closing the auth dialog goes back to the game, still as a guest
    pressEscape('.auth-dialog');
    await settle();

    expect(getAddress()).toBe('/?game=chess');
    expect(isOpen('.game-details')).toBe(true);
    expect(
      getRequests(fetchMock).filter((request: string): boolean => request.startsWith('POST')),
    ).toEqual([]);
  });

  it('only says that the session expired when it ends at the click', async (): Promise<void> => {
    saveSession(Date.now());
    const fetchMock: FetchMock = stubGameApi();
    visit('/?game=chess');
    await settle();
    // The session ran out while the dialog was open
    saveSession(Date.now() - SESSION_LIFETIME - 1000);

    document.querySelector<HTMLButtonElement>('.game-details__favorite')?.click();

    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: SESSION_EXPIRED_MESSAGE,
    });
    expect(isOpen('.auth-dialog')).toBe(true);
    expect(getAddress()).toBe('/?game=chess&auth=login');
    expect(
      getRequests(fetchMock).filter((request: string): boolean => request.startsWith('POST')),
    ).toEqual([]);
  });

  it('loads the open game again as a guest when the session ends', async (): Promise<void> => {
    saveSession(Date.now());
    const fetchMock: FetchMock = stubGameApi();
    visit('/?game=chess');
    await settle();

    // Logged out in another tab
    localStorage.removeItem(SESSION_STORAGE_KEY);
    globalThis.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY }));
    await settle();

    expect(getRequests(fetchMock).at(-2)).toBe('GET /api/games/chess');
    expect(document.querySelector('.game-details__favorite')?.textContent).toBe(
      GAME_DETAILS_CONTENT.addFavoriteLabel,
    );
  });
});
