// A game with the field names of the course's mock data (`all-games-seed.json`).
// The card image is the imported file instead of the mock's server path.
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
