import {
  LibraryParameter,
  SortOrder,
  type LibraryContent,
  type PaginationContent,
  type SortOption,
} from '../types/library.ts';

export const LIBRARY_CONTENT: LibraryContent = {
  title: 'Game Library',
  description: 'Browse our collection of casual mini-games',
  categoriesLabel: 'Categories',
  sortPrefix: 'Sort by:',
  sortListLabel: 'Sort games by',
  gamesTitle: 'Games',
  detailsText: 'Details',
  categoryLabel: 'Category',
  ratingLabel: 'Rating',
  likesLabel: 'Likes',
  gamesMessages: {
    errorTitle: "Couldn't load the games",
    successMessage: 'The games are loaded',
  },
  notFoundTitle: 'Data Not Found',
  notFoundMessage: 'No games match this choice yet. Try another category or see them all.',
  showAllText: 'Show all games',
  categoriesMessages: {
    errorTitle: "Couldn't load the categories",
    successMessage: 'The categories are loaded',
  },
  noCategoriesText: 'No categories yet',
  invalidParameterMessages: {
    [LibraryParameter.Category]:
      'The address named an unknown category, so the default one is shown.',
    [LibraryParameter.Sort]:
      'The address named an unknown sort order, so the games are sorted by rating.',
    [LibraryParameter.Page]: 'The address named an invalid page, so the first page is shown.',
  },
};

// The options of the style guide's sort menu, in its order. The API sorts the
// games by the picked one.
export const SORT_OPTIONS: readonly SortOption[] = [
  { order: SortOrder.RatingAscending, label: 'Rating ↑', spokenLabel: 'Rating, lowest first' },
  { order: SortOrder.RatingDescending, label: 'Rating ↓', spokenLabel: 'Rating, highest first' },
  { order: SortOrder.NameAscending, label: 'Name A→Z', spokenLabel: 'Name, A to Z' },
  { order: SortOrder.NameDescending, label: 'Name Z→A', spokenLabel: 'Name, Z to A' },
];

export const DEFAULT_SORT_ORDER: SortOrder = SortOrder.RatingDescending;

export const PAGINATION_CONTENT: PaginationContent = {
  label: 'Pages',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  pageLabel: 'Page',
};
