import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { showSnackbar } from '../../components/snackbar/snackbar.ts';
import { LIBRARY_CONTENT } from '../../data/library.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { Game } from '../../types/game.ts';
import { LibraryParameter } from '../../types/library.ts';
import { Route, type AppLocation, type PageView } from '../../types/route.ts';
import { renderLibraryPage } from './library-page.ts';

vi.mock('../../components/snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

type FetchMock = Mock<typeof fetch>;
type Navigate = Mock<(query: URLSearchParams, isReplace: boolean) => void>;

const CATEGORIES = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'card', label: 'Card', isDefault: false },
];

function createGameData(slug: string, name: string): Record<string, unknown> {
  return {
    slug,
    name,
    category: 'puzzle',
    price: 'Free',
    shortDescription: `${name} in short.`,
    rating: 4.9,
    likesCount: 38_200,
    cardImage: `/assets/images/games/${slug}-card.jpg`,
  };
}

// The API: the categories, and two games on every page of three. A page past
// the third has no games.
function stubApi(): FetchMock {
  const fetchMock: FetchMock = vi.fn<typeof fetch>(
    (input: URL | RequestInfo): Promise<Response> => {
      const url: URL = input instanceof URL ? input : new URL('about:blank');
      if (url.pathname.endsWith('/categories')) {
        return Promise.resolve(Response.json({ data: CATEGORIES }));
      }
      const page: number = Number(url.searchParams.get('page'));
      const games: Record<string, unknown>[] =
        page > 3
          ? []
          : [createGameData('cat-mail-co', 'Cat Mail Co.'), createGameData('palia', 'Palia')];

      return Promise.resolve(Response.json({ data: games, meta: { page, totalPages: 3 } }));
    },
  );
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function createLocation(query: string): AppLocation {
  return { path: Route.Library, route: Route.Library, query: new URLSearchParams(query), hash: '' };
}

interface TestPage {
  readonly view: PageView;
  readonly onNavigate: Navigate;
  readonly onGameOpen: Mock<(game: Game) => void>;
}

function renderPage(query: string): TestPage {
  const onNavigate: Navigate = vi.fn<(query: URLSearchParams, isReplace: boolean) => void>();
  const onGameOpen: Mock<(game: Game) => void> = vi.fn<(game: Game) => void>();
  const view: PageView = renderLibraryPage(createLocation(query), { onNavigate, onGameOpen });
  document.body.append(...view.elements);

  return { view, onNavigate, onGameOpen };
}

// The games the API was asked for, as the query of each request
function getGameQueries(fetchMock: FetchMock): string[] {
  return fetchMock.mock.calls
    .map(([input]: Parameters<typeof fetch>): URL | undefined =>
      input instanceof URL ? input : undefined,
    )
    .filter((url: URL | undefined): url is URL => url?.pathname.endsWith('/games') === true)
    .map((url: URL): string => url.search);
}

// The addresses the page asked for, and whether each one replaces the current
function getNavigations(onNavigate: Navigate): string[] {
  return onNavigate.mock.calls.map(
    ([query, isReplace]: [URLSearchParams, boolean]): string =>
      `${query.toString()} ${isReplace ? 'replace' : 'push'}`,
  );
}

function getText(selector: string): string[] {
  return [...document.querySelectorAll(selector)].map(
    (element: Element): string => element.textContent,
  );
}

// Lets the answers of the mocked API arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('Library page', (): void => {
  it('loads the categories first, then the games the address asks for', async (): Promise<void> => {
    const fetchMock: FetchMock = stubApi();

    renderPage('category=puzzle&sort=name-asc&page=2');
    await settle();

    expect(getGameQueries(fetchMock)).toEqual(['?category=puzzle&sort=name-asc&page=2&limit=6']);
    expect(getText('.category-filter__chip[aria-pressed="true"]')).toEqual(['Puzzle']);
    expect(getText('.sort-select__label')[0]).toContain('Name A→Z');
    expect(getText('.game-card__title')).toEqual(['Cat Mail Co.', 'Palia']);
    expect(document.querySelector('.pagination [aria-current="page"]')?.textContent).toBe('Page 2');
  });

  it('asks for a new address when a chip or a page is chosen', async (): Promise<void> => {
    stubApi();
    const { onNavigate } = renderPage('category=puzzle&page=2');
    await settle();

    const cardChip: HTMLButtonElement | undefined = [
      ...document.querySelectorAll<HTMLButtonElement>('.category-filter__chip'),
    ].find((chip: HTMLButtonElement): boolean => chip.textContent === 'Card');
    cardChip?.click();
    document.querySelector<HTMLButtonElement>('.pagination [aria-current="false"]')?.click();

    expect(getNavigations(onNavigate)).toEqual([
      'category=card&sort=rating-desc&page=1 push',
      'category=puzzle&sort=rating-desc&page=1 push',
    ]);
  });

  it('opens the details of a game from its card', async (): Promise<void> => {
    stubApi();
    const { onGameOpen } = renderPage('');
    await settle();

    document.querySelector<HTMLElement>('.game-card__details')?.click();

    expect(onGameOpen).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ slug: 'cat-mail-co', name: 'Cat Mail Co.' }),
    );
  });

  it('puts the default in place of an unknown category, with a warning', async (): Promise<void> => {
    stubApi();
    const { onNavigate } = renderPage('category=bogus&sort=name-desc');
    await settle();

    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: LIBRARY_CONTENT.invalidParameterMessages[LibraryParameter.Category],
    });
    expect(getNavigations(onNavigate)).toEqual(['category=all&sort=name-desc&page=1 replace']);
  });

  it('loads another page of the same list without drawing the page again', async (): Promise<void> => {
    const fetchMock: FetchMock = stubApi();
    const { view } = renderPage('page=1');
    await settle();

    view.update?.(createLocation('page=3'));
    // The new page is marked before its games arrive
    expect(document.querySelector('.pagination [aria-current="page"]')?.textContent).toBe('Page 3');
    await settle();

    expect(getGameQueries(fetchMock)).toEqual([
      '?category=all&sort=rating-desc&page=1&limit=6',
      '?category=all&sort=rating-desc&page=3&limit=6',
    ]);
  });

  it('offers the first page for a page past the end of the list', async (): Promise<void> => {
    stubApi();
    const { onNavigate } = renderPage('page=9');
    await settle();

    expect(document.body.textContent).toContain(LIBRARY_CONTENT.pastEndMessage);

    const firstPage: HTMLButtonElement | undefined = [
      ...document.querySelectorAll<HTMLButtonElement>('.game-list button'),
    ].find(
      (button: HTMLButtonElement): boolean => button.textContent === LIBRARY_CONTENT.firstPageText,
    );
    firstPage?.click();

    expect(getNavigations(onNavigate)).toEqual(['category=all&sort=rating-desc&page=1 push']);
  });
});
