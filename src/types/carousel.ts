// How a card sits in the row: the active card is the big one in the middle,
// the near cards are its neighbors and the far cards are the outer ones
export enum SlideRole {
  Far = 'far',
  Near = 'near',
  Active = 'active',
}

// The part of a game that the carousel shows, with the field names of the
// course's mock dataset
export interface CarouselGame {
  readonly slug: string;
  readonly name: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly image: string;
}

export interface CarouselSlide {
  readonly game: CarouselGame;
  readonly role: SlideRole;
}

export interface CarouselContent {
  readonly title: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  // Read out before the numbers, which show only an icon on the screen
  readonly ratingLabel: string;
  readonly likesLabel: string;
}
