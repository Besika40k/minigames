import { FREE_PRICE } from '../../data/games.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type { GameDetails, GameSpecs } from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { formatCompactNumber, formatRating } from '../../utils/format-number.ts';
import { createButton, createButtonLink } from '../button/button.ts';
import { createFavoriteButton, type FavoriteButtonOptions } from './game-details-favorite.ts';
import './game-details-info.scss';

const SPEC_NAMES: readonly (keyof GameSpecs)[] = ['genre', 'players', 'duration', 'price'];

// A text that is only read out, for the numbers that show just an icon
function createHiddenLabel(text: string): HTMLSpanElement {
  return createElement('span', { className: 'game-details__hidden', text: `${text}: ` });
}

// What the info needs for its Favorites button besides the game
export type GameInfoOptions = Pick<FavoriteButtonOptions, 'requireSession' | 'onUnconfirmed'>;

function createStats(game: GameDetails, likesCount: HTMLSpanElement): HTMLParagraphElement {
  const rating: HTMLSpanElement = createElement('span', {
    className: 'game-details__rating',
    children: [
      createIcon(IconName.Star),
      createHiddenLabel(GAME_DETAILS_CONTENT.ratingLabel),
      formatRating(game.rating),
    ],
  });

  const likes: HTMLSpanElement = createElement('span', {
    className: 'game-details__likes',
    children: [
      createIcon(IconName.Heart),
      createHiddenLabel(GAME_DETAILS_CONTENT.likesLabel),
      likesCount,
    ],
  });

  return createElement('p', { className: 'game-details__stats', children: [rating, likes] });
}

// A free game is played at once; any other one is bought first, for its price
function getPlayText(price: string): string {
  return price === FREE_PRICE
    ? GAME_DETAILS_CONTENT.playLabel
    : `${GAME_DETAILS_CONTENT.buyLabel}: ${price}`;
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

// Play Now of a game of the API, or Buy Now for one that is not free. It does
// nothing yet.
function createPlayButton(price: string): HTMLButtonElement {
  return createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    text: getPlayText(price),
    className: 'game-details__play',
  });
}

// Play Now of a game of MiniGames itself: a link to the site the game is
// played on
function createPlayLink(playUrl: string): HTMLAnchorElement {
  return createButtonLink({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Medium,
    text: GAME_DETAILS_CONTENT.playLabel,
    href: playUrl,
    className: 'game-details__play',
  });
}

// The title, rating and likes, description, specs, and the buttons to play
// the game and to add it to the favorites
export function createGameDetailsInfo(
  game: GameDetails,
  titleId: string,
  options: GameInfoOptions,
): HTMLElement {
  const likesCount: HTMLSpanElement = createElement('span', {
    text: formatCompactNumber(game.likesCount),
  });
  // The likes count the users who have the game among their favorites, so
  // they follow the Favorites button
  const favoriteButton: HTMLButtonElement = createFavoriteButton({
    ...options,
    game,
    onLikesChange: (count: number): void => {
      likesCount.textContent = formatCompactNumber(count);
    },
  });
  const playButton: HTMLElement =
    game.playUrl === undefined ? createPlayButton(game.specs.price) : createPlayLink(game.playUrl);

  const header: HTMLDivElement = createElement('div', {
    className: 'game-details__header',
    children: [
      createElement('h2', {
        className: 'game-details__title',
        text: game.name,
        attributes: { id: titleId },
      }),
      createStats(game, likesCount),
    ],
  });

  return createElement('section', {
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
}
