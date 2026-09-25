import {
  SortOrder,
  type Category,
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
};

// The categories of the course's mock data (`categories.json`), in the order of
// the mockup. Picking one only marks it: filtering comes in a later story.
export const CATEGORIES: readonly Category[] = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'card', label: 'Card', isDefault: false },
  { slug: 'match', label: 'Match', isDefault: false },
  { slug: 'farm', label: 'Farm', isDefault: false },
  { slug: 'strategy', label: 'Strategy', isDefault: false },
  { slug: 'arcade', label: 'Arcade', isDefault: false },
];

// The options of the style guide's sort menu. Picking one only shows it in the
// control: sorting comes in a later story.
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

// The course's mock data has 24 games and the mockup shows six on a page. The
// pagination only marks the page for now: the cards do not change.
export const LIBRARY_PAGE_COUNT = 4;
