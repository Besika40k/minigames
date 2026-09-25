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
}
