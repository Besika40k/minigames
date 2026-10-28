import { OWN_GAMES } from '../data/own-games.ts';
import type { OwnGame } from '../types/game.ts';
import type { GameDetails } from '../types/game-details.ts';

// The game of MiniGames itself with this slug, or undefined for any other game
export function findOwnGame(slug: string): OwnGame | undefined {
  return OWN_GAMES.find((game: OwnGame): boolean => game.slug === slug);
}

// The details of a game of MiniGames itself, in the shape of the API's. It has
// no records yet, and nobody can have it among their favorites.
export function getOwnGameDetails(game: OwnGame): GameDetails {
  return {
    slug: game.slug,
    name: game.name,
    heroImage: game.heroImage,
    rating: game.rating,
    likesCount: game.likesCount,
    isLikedByCurrentUser: false,
    fullDescription: game.fullDescription,
    specs: game.specs,
    topRecords: [],
    playUrl: game.playUrl,
  };
}
