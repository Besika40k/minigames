import { createGameDevelopers } from './game-developers/game-developers.ts';
import { createGamesCarousel } from './games-carousel/games-carousel.ts';
import { createHero } from './hero/hero.ts';
import { createLeaderboard } from './leaderboard/leaderboard.ts';

export function renderHomePage(): readonly HTMLElement[] {
  return [createHero(), createGamesCarousel(), createLeaderboard(), createGameDevelopers()];
}
