import { createButton } from '../../../components/button/button.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { CAROUSEL_CONTENT, CAROUSEL_SLIDES } from '../../../data/carousel.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import type { CarouselGame, CarouselSlide } from '../../../types/carousel.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import { formatCompactNumber } from '../../../utils/format-number.ts';
import './games-carousel.scss';

const TITLE_ID = 'games-carousel-title';

// The size of the card photos, so the browser can reserve their space
const IMAGE_WIDTH = '460';
const IMAGE_HEIGHT = '215';

const RATING_FRACTION_DIGITS = 1;

// A text that is only read out, for the numbers that show just an icon
function createHiddenLabel(text: string): HTMLSpanElement {
  return createElement('span', { className: 'games-carousel__hidden', text: `${text}: ` });
}

function createStats(game: CarouselGame): HTMLParagraphElement {
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

// The photo is decoration: the title next to it names the game. Cards that are
// too narrow for the title keep it for screen readers only (see the styles).
function createCard(slide: CarouselSlide): HTMLLIElement {
  const image: HTMLImageElement = createElement('img', {
    className: 'games-carousel__image',
    attributes: { src: slide.game.image, alt: '', width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
  });

  const overlay: HTMLDivElement = createElement('div', {
    className: 'games-carousel__overlay',
    children: [
      createElement('h3', { className: 'games-carousel__title', text: slide.game.name }),
      createStats(slide.game),
    ],
  });

  return createElement('li', {
    className: `games-carousel__card games-carousel__card--${slide.role}`,
    children: [image, overlay],
  });
}

// The arrows do nothing yet: the slider is not part of Story 1
function createArrows(): HTMLDivElement {
  const previous: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Icon,
    label: CAROUSEL_CONTENT.previousLabel,
    className: 'games-carousel__arrow',
    children: [createIcon(IconName.ArrowBack)],
  });

  const next: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Icon,
    label: CAROUSEL_CONTENT.nextLabel,
    className: 'games-carousel__arrow',
    children: [createIcon(IconName.ArrowForward)],
  });

  return createElement('div', { className: 'games-carousel__arrows', children: [previous, next] });
}

export function createGamesCarousel(): HTMLElement {
  const header: HTMLDivElement = createElement('div', {
    className: 'games-carousel__header',
    children: [createSectionTitle(TITLE_ID, [CAROUSEL_CONTENT.title]), createArrows()],
  });

  const cards: HTMLLIElement[] = CAROUSEL_SLIDES.map((slide: CarouselSlide): HTMLLIElement =>
    createCard(slide),
  );
  const track: HTMLUListElement = createElement('ul', {
    className: 'games-carousel__track',
    children: cards,
  });

  const inner: HTMLDivElement = createElement('div', {
    className: 'games-carousel__inner',
    children: [header, track],
  });

  return createElement('section', {
    className: 'games-carousel',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
