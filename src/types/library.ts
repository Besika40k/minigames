// A category of the filter chips, with the field names of the course's mock
// data (`categories.json`)
export interface Category {
  readonly slug: string;
  readonly label: string;
  readonly isDefault: boolean;
}

export enum SortOrder {
  RatingAscending = 'rating-ascending',
  RatingDescending = 'rating-descending',
  NameAscending = 'name-ascending',
  NameDescending = 'name-descending',
}

export interface SortOption {
  readonly order: SortOrder;
  // The text on the screen, with the mockup's arrows
  readonly label: string;
  // The text read out instead, because screen readers spell the arrows out
  readonly spokenLabel: string;
}

export interface LibraryContent {
  readonly title: string;
  readonly description: string;
  readonly categoriesLabel: string;
  readonly sortPrefix: string;
  readonly sortListLabel: string;
  // The heading of the card list, for screen readers only
  readonly gamesTitle: string;
  readonly detailsText: string;
  // Read out before the numbers and the tag, which show no words on the screen
  readonly categoryLabel: string;
  readonly ratingLabel: string;
  readonly likesLabel: string;
}

export interface PaginationContent {
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  // Read out before each page number
  readonly pageLabel: string;
}
