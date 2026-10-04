import type { Game } from '../../types/game.ts';
import type { PageView } from '../../types/route.ts';
import { createGameDevelopers } from './game-developers/game-developers.ts';
import { createGamesCarousel, type GamesCarousel } from './games-carousel/games-carousel.ts';
import { createHero } from './hero/hero.ts';
import { createLeaderboard, type Leaderboard } from './leaderboard/leaderboard.ts';

export interface HomePageOptions {
  // Opens the details of a game (a click on a slider card)
  readonly onGameOpen?: (game: Game) => void;
}

export function renderHomePage(options: HomePageOptions = {}): PageView {
  const carousel: GamesCarousel = createGamesCarousel({ onGameOpen: options.onGameOpen });
  const leaderboard: Leaderboard = createLeaderboard();

  return {
    elements: [createHero(), carousel.element, leaderboard.element, createGameDevelopers()],
    destroy: (): void => {
      carousel.destroy();
      leaderboard.destroy();
    },
  };
}
