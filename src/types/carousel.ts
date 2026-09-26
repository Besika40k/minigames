// How a card sits in the row: the active card is the big one in the middle,
// the near cards are its neighbors, the far cards are the outer ones, and the
// hidden cards wait off the row until the slider brings them in
export enum SlideRole {
  Active = 'active',
  Near = 'near',
  Far = 'far',
  Hidden = 'hidden',
}

export interface CarouselContent {
  readonly title: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  // Read out before the numbers, which show only an icon on the screen
  readonly ratingLabel: string;
  readonly likesLabel: string;
  // Read out with each card's place in the slider: "Palia, 5 of 9"
  readonly positionSeparator: string;
}
