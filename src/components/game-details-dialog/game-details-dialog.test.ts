import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGameComments } from '../../api/comments-api.ts';
import { fetchGameDetails } from '../../api/games-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { UNRATED_TEXT } from '../../data/games.ts';
import type { GameDetails, GameDetailsDialog } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createGameDetailsDialog } from './game-details-dialog.ts';

vi.mock('../../api/games-api.ts', () => ({ fetchGameDetails: vi.fn() }));
vi.mock('../../api/comments-api.ts', () => ({ fetchGameComments: vi.fn(), postComment: vi.fn() }));

const CHESS: GameDetails = {
  slug: 'chess',
  name: 'Chess',
  heroImage: '/chess.jpg',
  rating: 4.8,
  likesCount: 1200,
  isLikedByCurrentUser: false,
  fullDescription: 'The classic.',
  specs: { genre: 'Strategy', players: 'Two', duration: '30 min', price: 'Free' },
  topRecords: [],
};

function renderDialog(): GameDetailsDialog {
  const dialog: GameDetailsDialog = createGameDetailsDialog({
    onClose: vi.fn<() => void>(),
    getSession: vi.fn<() => AppSession | undefined>(),
    requireSession: vi.fn<(warning: string) => AppSession | undefined>(),
  });
  document.body.append(dialog.element);

  return dialog;
}

function getText(selector: string): string | undefined {
  return document.querySelector(selector)?.textContent;
}

function isCommentsHidden(): boolean | undefined {
  return document.querySelector('.game-details__content--bottom')?.hasAttribute('hidden');
}

// Lets the answers of the mocked requests arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
  vi.mocked(fetchGameDetails).mockResolvedValue(CHESS);
  vi.mocked(fetchGameComments).mockResolvedValue({ comments: [], totalComments: 0 });
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('game details dialog', (): void => {
  it('shows a game of MiniGames itself from the app, with a link to play it', async (): Promise<void> => {
    renderDialog().show('alchemists-cauldron');
    await settle();

    expect(getText('.game-details__title')).toBe("Alchemist's Cauldron");
    expect(getText('.game-details__rating')).toContain(UNRATED_TEXT);
    const play: HTMLAnchorElement | null = document.querySelector('a.game-details__play');
    expect(play?.href).toBe('https://besika40k.github.io/alchemists-cauldron/');
    expect(play?.textContent).toBe(GAME_DETAILS_CONTENT.playLabel);
    expect(getText('.game-details__no-records')).toBe(GAME_DETAILS_CONTENT.noRecordsText);
    expect(fetchGameDetails).not.toHaveBeenCalled();
  });

  it('leaves out the favorites and comments the API keeps only for its own games', async (): Promise<void> => {
    renderDialog().show('alchemists-cauldron');
    await settle();

    expect(document.querySelector('.game-details__favorite')).toBeNull();
    expect(isCommentsHidden()).toBe(true);
    expect(fetchGameComments).not.toHaveBeenCalled();
  });

  it('loads any other game and its comments from the API', async (): Promise<void> => {
    const dialog: GameDetailsDialog = renderDialog();
    dialog.show('alchemists-cauldron');
    await settle();

    dialog.show('chess');
    await settle();

    expect(fetchGameDetails).toHaveBeenCalledExactlyOnceWith(
      'chess',
      expect.any(AbortSignal),
      undefined,
    );
    expect(getText('.game-details__title')).toBe('Chess');
    expect(document.querySelector('button.game-details__play')).not.toBeNull();
    expect(document.querySelector('.game-details__favorite')).not.toBeNull();
    expect(isCommentsHidden()).toBe(false);
    expect(fetchGameComments).toHaveBeenCalledOnce();
  });
});
