import type { GameSpecs } from './game-details.ts';

// A game with the field names of the API (`GET /api/games`). The card image is
// the address the browser loads it from.
export interface Game {
  readonly slug: string;
  readonly name: string;
  // The slug of the game's category (see the categories of the Library page)
  readonly category: string;
  // "Free" or a price such as "$1.99"
  readonly price: string;
  readonly shortDescription: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly cardImage: string;
}

// A game made for MiniGames itself. The API does not know it, so the app keeps
// its card and its details, and the game is played on its own site.
export interface OwnGame extends Game {
  readonly heroImage: string;
  readonly fullDescription: string;
  readonly specs: GameSpecs;
  readonly playUrl: string;
}

// One page of the game list, with the numbers the pagination is built from
export interface GamesPage {
  readonly games: readonly Game[];
  readonly page: number;
  readonly totalPages: number;
}
