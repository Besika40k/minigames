import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type { GameDetails, GameDetailsSection, GameSpecs } from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { formatCompactNumber } from '../../utils/format-number.ts';
import { createButton } from '../button/button.ts';
import './game-details-info.scss';

const RATING_FRACTION_DIGITS = 1;

const SPEC_NAMES: readonly (keyof GameSpecs)[] = ['genre', 'players', 'duration', 'price'];

// A text that is only read out, for the numbers that show just an icon
function createHiddenLabel(text: string): HTMLSpanElement {
  return createElement('span', { className: 'game-details__hidden', text: `${text}: ` });
}

function createStats(game: GameDetails): HTMLParagraphElement {
  const rating: HTMLSpanElement = createElement('span', {
    className: 'game-details__rating',
    children: [
      createIcon(IconName.Star),
      createHiddenLabel(GAME_DETAILS_CONTENT.ratingLabel),
      game.rating.toFixed(RATING_FRACTION_DIGITS),
    ],
  });

  const likes: HTMLSpanElement = createElement('span', {
    className: 'game-details__likes',
    children: [
      createIcon(IconName.Heart),
      createHiddenLabel(GAME_DETAILS_CONTENT.likesLabel),
      formatCompactNumber(game.likesCount),
    ],
  });

  return createElement('p', { className: 'game-details__stats', children: [rating, likes] });
}

// The genre, players, duration and price, as name and value pairs
function createSpecs(specs: GameSpecs): HTMLDListElement {
  const items: HTMLDivElement[] = SPEC_NAMES.map((name: keyof GameSpecs): HTMLDivElement =>
    createElement('div', {
      className: 'game-details__spec',
      children: [
        createElement('dt', {
          className: 'game-details__spec-name',
          text: GAME_DETAILS_CONTENT.specLabels[name],
        }),
        createElement('dd', { className: 'game-details__spec-value', text: specs[name] }),
      ],
    }),
  );

  return createElement('dl', { className: 'game-details__specs', children: items });
}

// The title, rating and likes, description, specs, and the Play Now and
// Favorites buttons. Play Now does nothing yet. Favorites switches between
// adding and removing, and says which one a click will do; on mobile only its
// heart shows.
export function createGameDetailsInfo(game: GameDetails, titleId: string): GameDetailsSection {
  let isFavorite = false;

  const favoriteText: HTMLSpanElement = createElement('span', {
    className: 'game-details__favorite-text',
  });
  const favoriteButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Medium,
    className: 'game-details__favorite',
    children: [createIcon(IconName.Heart), favoriteText],
  });

  const showFavorite = (): void => {
    favoriteText.textContent = isFavorite
      ? GAME_DETAILS_CONTENT.removeFavoriteLabel
      : GAME_DETAILS_CONTENT.addFavoriteLabel;
    favoriteButton.classList.toggle('game-details__favorite--active', isFavorite);
  };

  favoriteButton.addEventListener('click', (): void => {
    isFavorite = !isFavorite;
    showFavorite();
  });

  const playButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    text: GAME_DETAILS_CONTENT.playLabel,
    className: 'game-details__play',
  });

  const header: HTMLDivElement = createElement('div', {
    className: 'game-details__header',
    children: [
      createElement('h2', {
        className: 'game-details__title',
        text: game.name,
        attributes: { id: titleId },
      }),
      createStats(game),
    ],
  });

  const element: HTMLElement = createElement('section', {
    className: 'game-details__info',
    attributes: { 'aria-labelledby': titleId },
    children: [
      header,
      createElement('p', { className: 'game-details__description', text: game.fullDescription }),
      createSpecs(game.specs),
      createElement('div', {
        className: 'game-details__actions',
        children: [playButton, favoriteButton],
      }),
    ],
  });

  const reset = (): void => {
    isFavorite = false;
    showFavorite();
  };
  reset();

  return { element, reset };
}
