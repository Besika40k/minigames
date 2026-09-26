import { createButton } from '../../../components/button/button.ts';
import { FREE_PRICE } from '../../../data/games.ts';
import { CATEGORIES, LIBRARY_CONTENT } from '../../../data/library.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import type { Category } from '../../../types/library.ts';
import type { Game } from '../../../types/game.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import { formatCompactNumber } from '../../../utils/format-number.ts';
import './game-card.scss';

// The size of the card photos, so the browser can reserve their space
const IMAGE_WIDTH = '460';
const IMAGE_HEIGHT = '215';

const RATING_FRACTION_DIGITS = 1;

// A text that is only read out, for the numbers and the tag
function createHiddenText(text: string): HTMLSpanElement {
  return createElement('span', { className: 'game-card__hidden', text });
}

function getCategoryLabel(slug: string): string {
  const category: Category | undefined = CATEGORIES.find(
    (candidate: Category): boolean => candidate.slug === slug,
  );

  return category?.label ?? slug;
}

function createStats(game: Game): HTMLParagraphElement {
  const rating: HTMLSpanElement = createElement('span', {
    className: 'game-card__rating',
    children: [
      createIcon(IconName.Star),
      createHiddenText(`${LIBRARY_CONTENT.ratingLabel}: `),
      game.rating.toFixed(RATING_FRACTION_DIGITS),
    ],
  });

  const likes: HTMLSpanElement = createElement('span', {
    className: 'game-card__likes',
    children: [
      createIcon(IconName.Heart),
      createHiddenText(`${LIBRARY_CONTENT.likesLabel}: `),
      formatCompactNumber(game.likesCount),
    ],
  });

  return createElement('p', { className: 'game-card__stats', children: [rating, likes] });
}

// The button names its game for screen readers, since every card has one
function createDetailsButton(game: Game, onClick?: (game: Game) => void): HTMLButtonElement {
  return createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    className: 'game-card__details',
    children: [
      document.createTextNode(LIBRARY_CONTENT.detailsText),
      createHiddenText(`: ${game.name}`),
    ],
    onClick: (): void => {
      onClick?.(game);
    },
  });
}

// A game of the Library: its photo, name, category, price, description,
// rating and likes, and the button that opens its details. The photo is
// decoration: the title next to it names the game.
export function createGameCard(game: Game, onDetailsClick?: (game: Game) => void): HTMLElement {
  const titleId: string = `game-card-${game.slug}`;
  const isFree: boolean = game.price === FREE_PRICE;

  const image: HTMLImageElement = createElement('img', {
    className: 'game-card__image',
    attributes: {
      src: game.cardImage,
      alt: '',
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      loading: 'lazy',
    },
  });

  const body: HTMLDivElement = createElement('div', {
    className: 'game-card__body',
    children: [
      createElement('h3', {
        className: 'game-card__title',
        text: game.name,
        attributes: { id: titleId },
      }),
      createElement('p', {
        className: 'game-card__tag',
        children: [
          createHiddenText(`${LIBRARY_CONTENT.categoryLabel}: `),
          getCategoryLabel(game.category),
        ],
      }),
      createElement('p', {
        className: isFree ? 'game-card__price game-card__price--free' : 'game-card__price',
        text: game.price,
      }),
      createElement('p', { className: 'game-card__description', text: game.shortDescription }),
      createElement('div', {
        className: 'game-card__footer',
        children: [createStats(game), createDetailsButton(game, onDetailsClick)],
      }),
    ],
  });

  return createElement('article', {
    className: 'game-card',
    attributes: { 'aria-labelledby': titleId },
    children: [image, body],
  });
}
