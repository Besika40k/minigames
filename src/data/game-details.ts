import tukoniHeroImage from '../assets/images/games/tukoni-forest-keepers-hero.jpg';
import type { GameDetails, GameDetailsContent } from '../types/game-details.ts';

export const GAME_DETAILS_CONTENT: GameDetailsContent = {
  closeLabel: 'Close',
};

// The dialog shows this game for every card at this stage, whichever card opens
// it (the course's mock data `game-tukoni-forest-keepers.json`)
export const STATIC_GAME_DETAILS: GameDetails = {
  slug: 'tukoni-forest-keepers',
  name: 'Tukoni: Forest Keepers',
  heroImage: tukoniHeroImage,
};
