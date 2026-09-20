import { createGameDevelopers } from './game-developers/game-developers.ts';
import { createHero } from './hero/hero.ts';

export function renderHomePage(): readonly HTMLElement[] {
  return [createHero(), createGameDevelopers()];
}
