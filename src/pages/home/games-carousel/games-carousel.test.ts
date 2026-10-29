import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi, type Mock } from 'vitest';
import { loadOwnGames } from '../../../api/game-backend.ts';
import { fetchFeaturedGames } from '../../../api/games-api.ts';
import { OWN_GAMES } from '../../../data/own-games.ts';
import type { Game, OwnGame } from '../../../types/game.ts';
import { createGamesCarousel, type GamesCarousel } from './games-carousel.ts';

vi.mock('../../../api/games-api.ts', () => ({ fetchFeaturedGames: vi.fn() }));
vi.mock('../../../api/game-backend.ts', () => ({ loadOwnGames: vi.fn() }));

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

// The slider, stopped once the test is over so its autoplay ends with it
function renderCarousel(onGameOpen: (game: Game) => void): GamesCarousel {
  const carousel: GamesCarousel = createGamesCarousel({ onGameOpen });
  document.body.append(carousel.element);
  onTestFinished((): void => {
    carousel.destroy();
  });

  return carousel;
}

// Lets the answer of the mocked request arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

function getTitles(): string[] {
  return [...document.querySelectorAll('.games-carousel__title')].map(
    (title: Element): string => title.textContent,
  );
}

beforeEach((): void => {
  vi.mocked(fetchFeaturedGames).mockResolvedValue([PALIA]);
  // Firestore counts seven likes of the own game
  vi.mocked(loadOwnGames).mockResolvedValue(
    OWN_GAMES.map((game: OwnGame): OwnGame => ({ ...game, likesCount: 7 })),
  );
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('games carousel', (): void => {
  it('leads with the games of MiniGames itself, the first one active', async (): Promise<void> => {
    const onGameOpen: Mock<(game: Game) => void> = vi.fn<(game: Game) => void>();
    renderCarousel(onGameOpen);
    await settle();

    expect(getTitles()).toEqual(["Alchemist's Cauldron", 'Palia']);
    const active: HTMLElement | null = document.querySelector('.games-carousel__card--active');
    expect(active?.textContent).toContain("Alchemist's Cauldron");
    expect(active?.querySelector('.games-carousel__likes')?.textContent).toBe('Likes: 7');

    active?.querySelector<HTMLButtonElement>('.games-carousel__open')?.click();

    expect(onGameOpen).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ slug: 'alchemists-cauldron' }),
    );
  });
});
