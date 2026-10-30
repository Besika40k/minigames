import { fetchFavoriteGames } from '../../../api/profile-api.ts';
import { getRouteHref } from '../../../app/router.ts';
import { createButtonLink } from '../../../components/button/button.ts';
import { createAsyncArea, type AsyncArea } from '../../../components/feedback/async-area.ts';
import { createEmptyState } from '../../../components/feedback/empty-state.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { createSkeleton } from '../../../components/skeleton/skeleton.ts';
import { PROFILE_CONTENT } from '../../../data/profile.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import type { Game } from '../../../types/game.ts';
import { Route } from '../../../types/route.ts';
import { createElement } from '../../../utils/create-element.ts';
import './profile-favorites.scss';

const TITLE_ID = 'profile-favorites-title';

// The size of the card photos, so the browser can reserve their space
const IMAGE_WIDTH = '460';
const IMAGE_HEIGHT = '215';

// The skeleton holds the place of a row of games
const SKELETON_TILES = 3;

export interface ProfileFavorites {
  readonly element: HTMLElement;
  // Loads the favorites again, for example after the user changed one
  readonly reload: () => void;
  // Cancels the requests when the page closes
  readonly abort: () => void;
}

// A favorite game: its photo and name, as one button that opens its details.
// The photo is decoration: the name says which game it is.
function createTile(game: Game, onOpen: (game: Game) => void): HTMLLIElement {
  const button: HTMLButtonElement = createElement('button', {
    className: 'profile-favorites__tile',
    attributes: { type: 'button' },
    children: [
      createElement('img', {
        className: 'profile-favorites__image',
        attributes: {
          src: game.cardImage,
          alt: '',
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          loading: 'lazy',
        },
      }),
      createElement('span', { className: 'profile-favorites__name', text: game.name }),
    ],
  });
  button.addEventListener('click', (): void => {
    onOpen(game);
  });

  return createElement('li', { children: [button] });
}

function createSkeletonList(): readonly Node[] {
  return [
    createElement('ul', {
      className: 'profile-favorites__list',
      attributes: { 'aria-hidden': 'true' },
      children: Array.from({ length: SKELETON_TILES }, (): HTMLLIElement =>
        createElement('li', { children: [createSkeleton('profile-favorites__skeleton')] }),
      ),
    }),
  ];
}

// The games the user has among their favorites, from the API and from
// Firestore, each one leading to its details
export function createProfileFavorites(
  userEmail: string,
  onGameOpen: (game: Game) => void,
): ProfileFavorites {
  const content: HTMLDivElement = createElement('div', {
    className: 'profile-favorites__content',
  });

  const area: AsyncArea = createAsyncArea({
    container: content,
    messages: PROFILE_CONTENT.favoritesMessages,
    load: (signal: AbortSignal): Promise<readonly Game[]> => fetchFavoriteGames(userEmail, signal),
    renderSkeleton: createSkeletonList,
    renderData: (games: readonly Game[]): readonly Node[] => [
      createElement('ul', {
        className: 'profile-favorites__list',
        children: games.map((game: Game): HTMLLIElement => createTile(game, onGameOpen)),
      }),
    ],
    isEmpty: (games: readonly Game[]): boolean => games.length === 0,
    renderEmpty: (): readonly Node[] => [
      createEmptyState({
        title: PROFILE_CONTENT.noFavoritesTitle,
        message: PROFILE_CONTENT.noFavoritesMessage,
        action: createButtonLink({
          variant: ButtonVariant.Outlined,
          size: ButtonSize.Medium,
          text: PROFILE_CONTENT.libraryLinkText,
          href: getRouteHref(Route.Library),
        }),
      }),
    ],
  });
  area.reload();

  const element: HTMLElement = createElement('section', {
    className: 'profile-favorites',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [createSectionTitle(TITLE_ID, [PROFILE_CONTENT.favoritesTitle]), content],
  });

  return {
    element,
    reload: (): void => {
      area.reload();
    },
    abort: (): void => {
      area.abort();
    },
  };
}
