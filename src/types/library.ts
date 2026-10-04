import type { LoadMessages } from './feedback.ts';

// A category of the filter chips, with the field names of the API
// (`GET /api/categories`)
export interface Category {
  readonly slug: string;
  readonly label: string;
  readonly isDefault: boolean;
}

// The sort orders, in the values the API takes
export enum SortOrder {
  RatingAscending = 'rating-asc',
  RatingDescending = 'rating-desc',
  NameAscending = 'name-asc',
  NameDescending = 'name-desc',
}

export interface SortOption {
  readonly order: SortOrder;
  // The text on the screen, with the mockup's arrows
  readonly label: string;
  // The text read out instead, because screen readers spell the arrows out
  readonly spokenLabel: string;
}

// The keys of the Library's state in the address
export enum LibraryParameter {
  Category = 'category',
  Sort = 'sort',
  Page = 'page',
}

// The state of the Library that lives in the address and in the request for
// its games
export interface LibraryQuery {
  // The slug of a category; "all" means every game
  readonly category: string;
  readonly sort: SortOrder;
  // The page of the list, counted from 1
  readonly page: number;
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
  readonly gamesMessages: LoadMessages;
  // The placeholder of a list without games, with a way back to all of them
  readonly notFoundTitle: string;
  readonly notFoundMessage: string;
  readonly showAllText: string;
  readonly categoriesMessages: LoadMessages;
  readonly noCategoriesText: string;
  // The warning for an address whose value the Library cannot use
  readonly invalidParameterMessages: Readonly<Record<LibraryParameter, string>>;
}

export interface PaginationContent {
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  // Read out before each page number
  readonly pageLabel: string;
}
