import islandersNewShoresImage from '../assets/images/games/islanders-new-shores-card.jpg';
import shelveThePotionsImage from '../assets/images/games/shelve-the-potions-card.jpg';
import tailsideCozyCafeSimImage from '../assets/images/games/tailside-cozy-cafe-sim-card.jpg';
import vacationCafeSimulatorImage from '../assets/images/games/vacation-cafe-simulator-card.jpg';
import winterBurrowImage from '../assets/images/games/winter-burrow-card.jpg';
import { SlideRole, type CarouselContent, type CarouselSlide } from '../types/carousel.ts';

export const CAROUSEL_CONTENT: CarouselContent = {
  title: 'New Games',
  previousLabel: 'Previous games',
  nextLabel: 'Next games',
  ratingLabel: 'Rating',
  likesLabel: 'Likes',
};

// The five cards of the mockup, from left to right, with the numbers of the
// course's mock dataset (`all-games-seed.json`). The row does not move yet: the
// slider that changes the cards is not part of Story 1.
export const CAROUSEL_SLIDES: readonly CarouselSlide[] = [
  {
    role: SlideRole.Far,
    game: {
      slug: 'tailside-cozy-cafe-sim',
      name: 'Tailside: Cozy Cafe Sim',
      rating: 4.8,
      likesCount: 35_600,
      image: tailsideCozyCafeSimImage,
    },
  },
  {
    role: SlideRole.Near,
    game: {
      slug: 'islanders-new-shores',
      name: 'ISLANDERS: New Shores',
      rating: 4.9,
      likesCount: 54_200,
      image: islandersNewShoresImage,
    },
  },
  {
    role: SlideRole.Active,
    game: {
      slug: 'vacation-cafe-simulator',
      name: 'Vacation Cafe Simulator',
      rating: 4.8,
      likesCount: 28_750,
      image: vacationCafeSimulatorImage,
    },
  },
  {
    role: SlideRole.Near,
    game: {
      slug: 'winter-burrow',
      name: 'Winter Burrow',
      rating: 4.9,
      likesCount: 32_400,
      image: winterBurrowImage,
    },
  },
  {
    role: SlideRole.Far,
    game: {
      slug: 'shelve-the-potions',
      name: 'Shelve the Potions!',
      rating: 4.7,
      likesCount: 21_300,
      image: shelveThePotionsImage,
    },
  },
];
