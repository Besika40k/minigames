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

// One page of the game list, with the numbers the pagination is built from
export interface GamesPage {
  readonly games: readonly Game[];
  readonly page: number;
  readonly totalPages: number;
}
