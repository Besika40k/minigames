import type { Game } from '../../types/game.ts';
import { createGameDevelopers } from './game-developers/game-developers.ts';
import { createGamesCarousel } from './games-carousel/games-carousel.ts';
import { createHero } from './hero/hero.ts';
import { createLeaderboard } from './leaderboard/leaderboard.ts';

export interface HomePageOptions {
  // Opens the details of a game (a click on a slider card)
  readonly onGameOpen?: (game: Game) => void;
}

export function renderHomePage(options: HomePageOptions = {}): readonly HTMLElement[] {
  return [
    createHero(),
    createGamesCarousel({ onGameOpen: options.onGameOpen }),
    createLeaderboard(),
    createGameDevelopers(),
  ];
}
