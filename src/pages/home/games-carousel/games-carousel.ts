import { createButton } from '../../../components/button/button.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { CAROUSEL_CONTENT } from '../../../data/carousel.ts';
import { FEATURED_GAMES } from '../../../data/games.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import { SlideRole } from '../../../types/carousel.ts';
import type { Game } from '../../../types/game.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import { formatCompactNumber } from '../../../utils/format-number.ts';
import { enableSwipe, SwipeDirection } from './carousel-swipe.ts';
import './games-carousel.scss';

const TITLE_ID = 'games-carousel-title';

// The size of the card photos, so the browser can reserve their space
const IMAGE_WIDTH = '460';
const IMAGE_HEIGHT = '215';

const RATING_FRACTION_DIGITS = 1;

const ROLES: readonly SlideRole[] = [
  SlideRole.Active,
  SlideRole.Near,
  SlideRole.Far,
  SlideRole.Hidden,
];

// A text that is only read out, for the numbers that show just an icon
function createHiddenLabel(text: string): HTMLSpanElement {
  return createElement('span', { className: 'games-carousel__hidden', text: `${text}: ` });
}

function createStats(game: Game): HTMLParagraphElement {
  const rating: HTMLSpanElement = createElement('span', {
    className: 'games-carousel__rating',
    children: [
      createIcon(IconName.Star),
      createHiddenLabel(CAROUSEL_CONTENT.ratingLabel),
      game.rating.toFixed(RATING_FRACTION_DIGITS),
    ],
  });

  const likes: HTMLSpanElement = createElement('span', {
    className: 'games-carousel__likes',
    children: [
      createIcon(IconName.Heart),
      createHiddenLabel(CAROUSEL_CONTENT.likesLabel),
      formatCompactNumber(game.likesCount),
    ],
  });

  return createElement('p', { className: 'games-carousel__stats', children: [rating, likes] });
}

// A card: the photo, the title, rating and likes. The photo is decoration: the
// title names the game.
function createCard(game: Game): HTMLLIElement {
  const image: HTMLImageElement = createElement('img', {
    className: 'games-carousel__image',
    attributes: {
      src: game.cardImage,
      alt: '',
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      draggable: 'false',
    },
  });

  const overlay: HTMLDivElement = createElement('div', {
    className: 'games-carousel__overlay',
    children: [
      createElement('h3', { className: 'games-carousel__title', text: game.name }),
      createStats(game),
    ],
  });

  return createElement('li', {
    className: 'games-carousel__card',
    children: [image, overlay],
  });
}

// How many steps a card is from the active one, going the shorter way round
// the loop: from -4 (far left) to 4 (far right) for nine cards
function getDistance(index: number, activeIndex: number, count: number): number {
  const half: number = Math.floor(count / 2);

  return ((((index - activeIndex) % count) + count + half) % count) - half;
}

function getRole(distance: number): SlideRole {
  const roles: Readonly<Record<number, SlideRole>> = {
    0: SlideRole.Active,
    1: SlideRole.Near,
    2: SlideRole.Far,
  };

  return roles[Math.abs(distance)] ?? SlideRole.Hidden;
}

function createArrow(variant: ButtonVariant, label: string, icon: IconName): HTMLButtonElement {
  return createButton({
    variant,
    size: ButtonSize.Icon,
    label,
    className: 'games-carousel__arrow',
    children: [createIcon(icon)],
  });
}

// The slider of the featured games. Every card stays in the row: the order and
// width of each one follow its distance from the active card, so the cards
// slide and grow or shrink with CSS transitions, and a card that goes round the
// loop does it while it is hidden.
export function createGamesCarousel(): HTMLElement {
  let activeIndex = 0;

  const cards: HTMLLIElement[] = FEATURED_GAMES.map((game: Game): HTMLLIElement =>
    createCard(game),
  );

  const render = (): void => {
    for (const [index, card] of cards.entries()) {
      const distance: number = getDistance(index, activeIndex, cards.length);
      const role: SlideRole = getRole(distance);
      card.style.order = String(distance);
      for (const candidate of ROLES) {
        card.classList.toggle(`games-carousel__card--${candidate}`, candidate === role);
      }
    }
  };

  const move = (step: number): void => {
    activeIndex = (activeIndex + step + cards.length) % cards.length;
    render();
  };

  const track: HTMLUListElement = createElement('ul', {
    className: 'games-carousel__track',
    children: cards,
  });

  const previous: HTMLButtonElement = createArrow(
    ButtonVariant.Outlined,
    CAROUSEL_CONTENT.previousLabel,
    IconName.ArrowBack,
  );
  const next: HTMLButtonElement = createArrow(
    ButtonVariant.Filled,
    CAROUSEL_CONTENT.nextLabel,
    IconName.ArrowForward,
  );

  const header: HTMLDivElement = createElement('div', {
    className: 'games-carousel__header',
    children: [
      createSectionTitle(TITLE_ID, [CAROUSEL_CONTENT.title]),
      createElement('div', { className: 'games-carousel__arrows', children: [previous, next] }),
    ],
  });

  const section: HTMLElement = createElement('section', {
    className: 'games-carousel',
    attributes: { 'aria-labelledby': TITLE_ID, 'aria-roledescription': 'carousel' },
    children: [
      createElement('div', { className: 'games-carousel__inner', children: [header, track] }),
    ],
  });

  previous.addEventListener('click', (): void => {
    move(-1);
  });
  next.addEventListener('click', (): void => {
    move(1);
  });

  // A swipe moves one card, like the arrows
  enableSwipe(track, {
    onRelease: (direction: SwipeDirection | undefined): void => {
      if (direction === undefined) {
        return;
      }
      move(direction === SwipeDirection.Next ? 1 : -1);
    },
  });

  render();

  return section;
}
