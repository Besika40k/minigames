import { fetchFeaturedGames } from '../../../api/games-api.ts';
import { createButton } from '../../../components/button/button.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { CAROUSEL_CONTENT } from '../../../data/carousel.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import { SlideRole } from '../../../types/carousel.ts';
import type { Game } from '../../../types/game.ts';
import { AutoplayTimer } from '../../../utils/autoplay-timer.ts';
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

// The slider moves one card to the left every four seconds
const AUTOPLAY_INTERVAL = 4000;

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

// A card: the photo, the title, rating and likes, and a button over the whole
// card that opens the game's details. The photo is decoration: the button and
// the title name the game.
function createCard(game: Game, position: string, onOpen?: (game: Game) => void): HTMLLIElement {
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

  const openButton: HTMLButtonElement = createElement('button', {
    className: 'games-carousel__open',
    attributes: { type: 'button', 'aria-label': `${game.name}, ${position}` },
  });
  openButton.addEventListener('click', (): void => {
    onOpen?.(game);
  });

  return createElement('li', {
    className: 'games-carousel__card',
    children: [image, overlay, openButton],
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

export interface GamesCarouselOptions {
  // Opens the details of a game (a click on its card)
  readonly onGameOpen?: (game: Game) => void;
}

export interface GamesCarousel {
  readonly element: HTMLElement;
  // Stops the autoplay and the request when the page closes
  readonly destroy: () => void;
}

// The slider of the featured games, loaded from the API. Every card stays in
// the row: the order and width of each one follow its distance from the active
// card, so the cards slide and grow or shrink with CSS transitions, and a card
// that goes round the loop does it while it is hidden.
export function createGamesCarousel(options: GamesCarouselOptions = {}): GamesCarousel {
  let cards: HTMLLIElement[] = [];
  let activeIndex = 0;

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
    if (cards.length === 0) {
      return;
    }
    activeIndex = (activeIndex + step + cards.length) % cards.length;
    render();
  };

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

  // The arrows work only while there are cards to move
  const enableArrows = (isEnabled: boolean): void => {
    previous.disabled = !isEnabled;
    next.disabled = !isEnabled;
  };

  const header: HTMLDivElement = createElement('div', {
    className: 'games-carousel__header',
    children: [
      createSectionTitle(TITLE_ID, [CAROUSEL_CONTENT.title]),
      createElement('div', { className: 'games-carousel__arrows', children: [previous, next] }),
    ],
  });

  // The cards of the slider
  const body: HTMLDivElement = createElement('div', { className: 'games-carousel__body' });

  const section: HTMLElement = createElement('section', {
    className: 'games-carousel',
    attributes: { 'aria-labelledby': TITLE_ID, 'aria-roledescription': 'carousel' },
    children: [
      createElement('div', { className: 'games-carousel__inner', children: [header, body] }),
    ],
  });

  const timer: AutoplayTimer = new AutoplayTimer(AUTOPLAY_INTERVAL, (): void => {
    move(1);
  });

  // A manual step starts a new countdown, so the next automatic step does not
  // follow it too soon
  previous.addEventListener('click', (): void => {
    move(-1);
    timer.reset();
  });
  next.addEventListener('click', (): void => {
    move(1);
    timer.reset();
  });

  // The slides of the answer. The autoplay starts once they are on the screen.
  const showSlides = (games: readonly Game[]): readonly Node[] => {
    cards = games.map((game: Game, index: number): HTMLLIElement =>
      createCard(
        game,
        `${String(index + 1)} ${CAROUSEL_CONTENT.positionSeparator} ${String(games.length)}`,
        options.onGameOpen,
      ),
    );
    activeIndex = 0;

    const track: HTMLUListElement = createElement('ul', {
      className: 'games-carousel__track',
      children: cards,
    });

    // Holding the slider stops the countdown. Letting go without a swipe goes
    // on with the time that was left; a swipe starts a new countdown. A single
    // card has nowhere to go.
    enableSwipe(track, {
      onPress: (): void => {
        timer.pause();
      },
      onRelease: (direction: SwipeDirection | undefined): void => {
        if (cards.length < 2) {
          return;
        }
        if (direction === undefined) {
          timer.resume();
          return;
        }
        move(direction === SwipeDirection.Next ? 1 : -1);
        timer.reset();
      },
    });

    render();
    enableArrows(cards.length > 1);
    if (cards.length > 1) {
      timer.reset();
    }

    return [track];
  };

  // The arrows wait for the cards
  enableArrows(false);
  const controller: AbortController = new AbortController();
  const loadSlides = async (): Promise<void> => {
    try {
      const games: readonly Game[] = await fetchFeaturedGames(controller.signal);
      body.replaceChildren(...showSlides(games));
    } catch {
      // The loading, error and empty states come next. Until then a failed
      // request leaves the slider without cards.
      body.replaceChildren();
    }
  };
  void loadSlides();

  // A hidden browser tab would pile the steps up, so the slider waits for it
  const onVisibilityChange = (): void => {
    if (document.hidden) {
      timer.pause();
      return;
    }
    if (cards.length > 1) {
      timer.resume();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    element: section,
    destroy: (): void => {
      timer.stop();
      controller.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
