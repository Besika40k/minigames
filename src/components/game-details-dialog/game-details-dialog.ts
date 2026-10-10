import { ApiError, ApiErrorKind } from '../../api/api-error.ts';
import { fetchGameDetails } from '../../api/games-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type {
  GameCommentsSection,
  GameDetails,
  GameDetailsDialog,
} from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { enableDialogDismiss } from '../../utils/dismiss-dialog.ts';
import { createButton } from '../button/button.ts';
import { createAsyncArea, type AsyncArea } from '../feedback/async-area.ts';
import { createEmptyState } from '../feedback/empty-state.ts';
import './game-details-dialog.scss';
import { createGameDetailsComments } from './game-details-comments.ts';
import { createGameDetailsInfo } from './game-details-info.ts';
import { createGameDetailsRecords } from './game-details-records.ts';
import { createGameDetailsSkeleton } from './game-details-skeleton.ts';

// The size of the hero picture, so the browser can reserve its space
const HERO_WIDTH = '1920';
const HERO_HEIGHT = '1080';

const TITLE_ID = 'game-details-title';

export interface GameDetailsDialogOptions {
  // Asks to close the dialog: the close button, Esc and the backdrop
  readonly onClose: () => void;
  // The email of the signed-in user, or undefined for a guest. The game of a
  // signed-in user says whether it is among that user's favorites.
  readonly getUserEmail: () => string | undefined;
  // Checks the session before a change such as a favorite. A guest gets
  // undefined, and the auth dialog in place of this one.
  readonly requireSession: (warning: string) => AppSession | undefined;
}

// The cover picture of the game. It is decoration: the dialog is named by the
// game's title.
function createHero(game: GameDetails): HTMLElement {
  return createElement('div', {
    className: 'game-details__hero',
    children: [
      createElement('img', {
        className: 'game-details__image',
        attributes: { src: game.heroImage, alt: '', width: HERO_WIDTH, height: HERO_HEIGHT },
      }),
    ],
  });
}

// The state of a slug that names no game, with a way out of the dialog
function createNotFound(slug: string, onClose: () => void): HTMLElement {
  const notFound: HTMLElement = createEmptyState({
    title: GAME_DETAILS_CONTENT.notFoundTitle,
    message: `${GAME_DETAILS_CONTENT.notFoundMessageStart} "${slug}"${GAME_DETAILS_CONTENT.notFoundMessageEnd}`,
    action: createButton({
      variant: ButtonVariant.Outlined,
      size: ButtonSize.Medium,
      text: GAME_DETAILS_CONTENT.closeLabel,
      onClick: onClose,
    }),
  });

  return createElement('div', {
    className: 'game-details__content game-details__content--message',
    children: [notFound],
  });
}

// The dialog with the details of a game, loaded from the API for the slug it
// is shown with. It closes only through `onClose`, so the owner decides what a
// close means (the dialog lives in the address).
export function createGameDetailsDialog(options: GameDetailsDialogOptions): GameDetailsDialog {
  // The slug whose game the dialog shows or loads
  let slug: string = '';

  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'game-details',
    // The title names the dialog once the game is there
    attributes: { 'aria-labelledby': TITLE_ID, 'aria-label': GAME_DETAILS_CONTENT.dialogLabel },
  });

  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'game-details__close',
    attributes: { type: 'button', 'aria-label': GAME_DETAILS_CONTENT.closeLabel },
    children: [createIcon(IconName.Dismiss)],
  });
  closeButton.addEventListener('click', options.onClose);

  // The hero, the info and the records, or their skeleton, the error banner
  // or the Game Not Found state
  const main: HTMLDivElement = createElement('div', { className: 'game-details__main' });

  // The comments load next to the game, with states of their own, so a failed
  // comments request leaves the game on the screen. An unknown game has no
  // comments to show at all.
  const comments: GameCommentsSection = createGameDetailsComments();
  const bottom: HTMLDivElement = createElement('div', {
    className: 'game-details__content game-details__content--bottom',
    children: [comments.element],
  });

  // The close button comes first, so it is the first stop of the keyboard
  dialog.append(closeButton, main, bottom);
  enableDialogDismiss(dialog, options.onClose);

  const area: AsyncArea = createAsyncArea({
    container: main,
    messages: GAME_DETAILS_CONTENT.messages,
    load: (signal: AbortSignal): Promise<GameDetails> =>
      fetchGameDetails(slug, signal, options.getUserEmail()),
    renderSkeleton: createGameDetailsSkeleton,
    // Each game is drawn anew from the answer of the server
    renderData: (game: GameDetails): readonly Node[] => {
      const info: HTMLElement = createGameDetailsInfo(game, TITLE_ID, {
        requireSession: options.requireSession,
        onUnconfirmed: (): void => {
          area.reload();
        },
      });
      const content: HTMLDivElement = createElement('div', {
        className: 'game-details__content game-details__content--top',
        children: [info, createGameDetailsRecords(game)],
      });

      return [createHero(game), content];
    },
    // The API sends a game or a 404, never an empty answer
    isEmpty: (): boolean => false,
    renderEmpty: (): readonly Node[] => [],
    renderNotFound: (): readonly Node[] => [createNotFound(slug, options.onClose)],
    onError: (error: unknown): void => {
      const isNotFound: boolean = error instanceof ApiError && error.kind === ApiErrorKind.NotFound;
      if (!isNotFound) {
        return;
      }
      bottom.hidden = true;
      comments.abort();
    },
  });

  const show = (nextSlug: string): void => {
    if (nextSlug === slug && dialog.open) {
      return;
    }
    slug = nextSlug;
    bottom.hidden = false;
    area.reload();
    comments.show(slug);
    if (!dialog.open) {
      dialog.showModal();
    }
    // A long dialog opens at its top, even if it was scrolled when it closed
    dialog.scrollTop = 0;
  };

  const hide = (): void => {
    area.abort();
    comments.abort();
    if (dialog.open) {
      dialog.close();
    }
  };

  // Another user signed in or out: the open game shows that user's state
  const refresh = (): void => {
    if (!dialog.open) {
      return;
    }
    area.reload();
    comments.show(slug);
  };

  return { element: dialog, show, hide, refresh };
}
