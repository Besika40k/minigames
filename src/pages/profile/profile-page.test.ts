import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  fetchFavoriteGames,
  fetchUserProfile,
  fetchUserRecords,
  saveUserProfile,
} from '../../api/profile-api.ts';
import { showSnackbar } from '../../components/snackbar/snackbar.ts';
import { BIO_MAX_LENGTH, PROFILE_CONTENT } from '../../data/profile.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { Game } from '../../types/game.ts';
import { Route, type AppLocation, type PageView } from '../../types/route.ts';
import type { AppSession } from '../../types/session.ts';
import { resizeToSquare } from '../../utils/resize-image.ts';
import { renderProfilePage } from './profile-page.ts';

vi.mock('../../api/profile-api.ts', () => ({
  fetchUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
  fetchFavoriteGames: vi.fn(),
  fetchUserRecords: vi.fn(),
}));
vi.mock('../../components/snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));
vi.mock('../../utils/resize-image.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/resize-image.ts')>()),
  resizeToSquare: vi.fn(),
}));

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 29),
};
const PHOTO = 'data:image/webp;base64,AAAA';

const PALIA: Game = {
  slug: 'palia',
  name: 'Palia',
  category: 'strategy',
  price: 'Free',
  shortDescription: 'A cozy life.',
  rating: 4.8,
  likesCount: 89_500,
  cardImage: '/palia-card.jpg',
};

type SessionListener = (session: AppSession | undefined) => void;

interface TestPage {
  readonly view: PageView;
  readonly onLogin: Mock<() => void>;
  readonly onGameOpen: Mock<(game: Game) => void>;
  readonly onPhotoChange: Mock<(photo: string | undefined) => void>;
  // Tells the page that someone signed in or out
  readonly changeSession: SessionListener;
}

function createLocation(query: string): AppLocation {
  return { path: Route.Profile, route: Route.Profile, query: new URLSearchParams(query), hash: '' };
}

function renderPage(session: AppSession | undefined): TestPage {
  const listeners: Set<SessionListener> = new Set<SessionListener>();
  const onLogin: Mock<() => void> = vi.fn<() => void>();
  const onGameOpen: Mock<(game: Game) => void> = vi.fn<(game: Game) => void>();
  const onPhotoChange: Mock<(photo: string | undefined) => void> =
    vi.fn<(photo: string | undefined) => void>();
  const view: PageView = renderProfilePage(createLocation(''), {
    getSession: (): AppSession | undefined => session,
    subscribe: (listener: SessionListener): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
    requireSession: (): AppSession | undefined => session,
    onLogin,
    onGameOpen,
    onPhotoChange,
  });
  document.body.append(...view.elements);

  return {
    view,
    onLogin,
    onGameOpen,
    onPhotoChange,
    changeSession: (next: AppSession | undefined): void => {
      for (const listener of listeners) {
        listener(next);
      }
    },
  };
}

function getText(selector: string): string | undefined {
  return document.querySelector(selector)?.textContent;
}

function getButton(text: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (button: HTMLButtonElement): boolean => button.textContent === text,
  );
}

// Picks a file in the hidden file field, as the browser's window does
function chooseFile(file: File): void {
  const input: HTMLInputElement | null = document.querySelector('.profile-card__file');
  if (input === null) {
    return;
  }
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new Event('change'));
}

// Lets the answers of the mocked requests arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
  vi.mocked(fetchUserProfile).mockResolvedValue({ bio: 'I brew potions.' });
  vi.mocked(saveUserProfile).mockResolvedValue();
  vi.mocked(fetchFavoriteGames).mockResolvedValue([PALIA]);
  vi.mocked(fetchUserRecords).mockResolvedValue([]);
  vi.mocked(resizeToSquare).mockResolvedValue(PHOTO);
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('profile page', (): void => {
  it('asks a guest to log in', (): void => {
    const { onLogin } = renderPage(undefined);

    expect(getText('h1')).toBe(PROFILE_CONTENT.title);
    expect(document.body.textContent).toContain(PROFILE_CONTENT.guestTitle);
    getButton(PROFILE_CONTENT.loginText)?.click();

    expect(onLogin).toHaveBeenCalledOnce();
    expect(fetchUserProfile).not.toHaveBeenCalled();
  });

  it('shows the user, their bio and their favorite games', async (): Promise<void> => {
    const { onGameOpen } = renderPage(SESSION);
    await settle();

    expect(getText('h1')).toBe('Alex Pro');
    expect(getText('.profile-card__email')).toBe(SESSION.email);
    expect(getText('.profile-card__bio')).toBe('I brew potions.');
    expect(fetchFavoriteGames).toHaveBeenCalledExactlyOnceWith(
      SESSION.email,
      expect.any(AbortSignal),
    );

    document.querySelector<HTMLButtonElement>('.profile-favorites__tile')?.click();

    expect(onGameOpen).toHaveBeenCalledExactlyOnceWith(PALIA);
  });

  it('shows the best scores of the user', async (): Promise<void> => {
    vi.mocked(fetchUserRecords).mockResolvedValue([
      {
        gameSlug: 'alchemists-cauldron',
        gameName: "Alchemist's Cauldron",
        detail: 'Hard',
        score: 2400,
        achievedAt: '2026-10-30T10:00:00Z',
      },
    ]);
    renderPage(SESSION);
    await settle();

    expect(fetchUserRecords).toHaveBeenCalledExactlyOnceWith(SESSION.email);
    expect(getText('.profile-records__detail')).toBe('Hard');
    expect(getText('.profile-records__score')).toBe('2,400 pts');
  });

  it('invites a user without records to play', async (): Promise<void> => {
    renderPage(SESSION);
    await settle();

    expect(document.querySelector('.profile-records')?.textContent).toContain(
      PROFILE_CONTENT.noRecordsTitle,
    );
  });

  it('saves an edited bio and shows it', async (): Promise<void> => {
    renderPage(SESSION);
    await settle();

    getButton(PROFILE_CONTENT.editBioText)?.click();
    const input: HTMLTextAreaElement | null = document.querySelector('.profile-card__bio-input');
    if (input !== null) {
      input.value = '  Speedrunner  ';
      input.dispatchEvent(new Event('input'));
    }
    document.querySelector<HTMLFormElement>('.profile-card__bio-form')?.requestSubmit();
    await settle();

    expect(saveUserProfile).toHaveBeenCalledExactlyOnceWith(SESSION.email, { bio: 'Speedrunner' });
    expect(getText('.profile-card__bio')).toBe('Speedrunner');
    expect(showSnackbar).toHaveBeenCalledWith({
      variant: SnackbarVariant.Success,
      text: PROFILE_CONTENT.bioMessages.saved,
    });
  });

  it('will not save a bio that is too long', async (): Promise<void> => {
    renderPage(SESSION);
    await settle();

    getButton(PROFILE_CONTENT.editBioText)?.click();
    const input: HTMLTextAreaElement | null = document.querySelector('.profile-card__bio-input');
    if (input !== null) {
      input.value = 'a'.repeat(BIO_MAX_LENGTH + 1);
      input.dispatchEvent(new Event('input'));
    }

    expect(getButton(PROFILE_CONTENT.saveBioText)?.disabled).toBe(true);
    expect(getText('.profile-card__counter')).toBe(PROFILE_CONTENT.bioMessages.tooLong);
  });

  it('saves a chosen picture and tells the header', async (): Promise<void> => {
    const { onPhotoChange } = renderPage(SESSION);
    await settle();

    chooseFile(new File(['png'], 'me.png', { type: 'image/png' }));
    await settle();

    expect(saveUserProfile).toHaveBeenCalledExactlyOnceWith(SESSION.email, {
      bio: 'I brew potions.',
      photo: PHOTO,
    });
    expect(onPhotoChange).toHaveBeenLastCalledWith(PHOTO);
    expect(document.querySelector('.profile-card__avatar img')?.getAttribute('src')).toBe(PHOTO);
  });

  it('refuses a file that is not a picture', async (): Promise<void> => {
    renderPage(SESSION);
    await settle();

    chooseFile(new File(['text'], 'notes.txt', { type: 'text/plain' }));
    await settle();

    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Error,
      text: PROFILE_CONTENT.pictureMessages.notImage,
    });
    expect(saveUserProfile).not.toHaveBeenCalled();
  });

  it('removes the picture', async (): Promise<void> => {
    vi.mocked(fetchUserProfile).mockResolvedValue({ bio: 'Hi', photo: PHOTO });
    const { onPhotoChange } = renderPage(SESSION);
    await settle();

    getButton(PROFILE_CONTENT.removePictureText)?.click();
    await settle();

    expect(saveUserProfile).toHaveBeenCalledExactlyOnceWith(SESSION.email, { bio: 'Hi' });
    expect(onPhotoChange).toHaveBeenLastCalledWith(undefined);
  });

  it('draws the guest page when the user signs out', async (): Promise<void> => {
    const { changeSession } = renderPage(SESSION);
    await settle();

    changeSession(undefined);

    expect(getText('h1')).toBe(PROFILE_CONTENT.title);
  });

  it('loads the favorites again when the details of a game close', async (): Promise<void> => {
    const { view } = renderPage(SESSION);
    await settle();

    view.update?.(createLocation('game=palia'));
    view.update?.(createLocation(''));
    await settle();

    expect(fetchFavoriteGames).toHaveBeenCalledTimes(2);
  });
});
