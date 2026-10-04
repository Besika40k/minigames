import type { CarouselContent } from '../types/carousel.ts';

export const CAROUSEL_CONTENT: CarouselContent = {
  title: 'New Games',
  previousLabel: 'Previous games',
  nextLabel: 'Next games',
  ratingLabel: 'Rating',
  likesLabel: 'Likes',
  positionSeparator: 'of',
  messages: {
    errorTitle: "Couldn't load the new games",
    successMessage: 'The new games are loaded',
  },
  emptyTitle: 'No new games yet',
  emptyMessage: 'Fresh games show up here soon. Until then, the Library has them all.',
  libraryLinkText: 'Browse Library',
};
