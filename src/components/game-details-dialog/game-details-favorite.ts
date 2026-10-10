import { ApiError, isOutcomeUnknown } from '../../api/api-error.ts';
import { toggleFavorite } from '../../api/favorites-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { SnackbarVariant } from '../../types/feedback.ts';
import type { FavoriteMessages, FavoriteState, GameDetails } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { createButton, setButtonBusy } from '../button/button.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';

const MESSAGES: FavoriteMessages = GAME_DETAILS_CONTENT.favoriteMessages;

export interface FavoriteButtonOptions {
  readonly game: GameDetails;
  // Checks the session before a toggle. A guest gets undefined, and the auth
  // dialog in place of Game Details.
  readonly requireSession: (warning: string) => AppSession | undefined;
  // The likes of the game, as the server counts them after a toggle
  readonly onLikesChange: (likesCount: number) => void;
  // A toggle whose outcome is unknown: the game loads again instead of a
  // second toggle, which could undo the first
  readonly onUnconfirmed: () => void;
}

// The Favorites button. It starts from the signed-in user's state in the game
// details and shows only what the server confirms: it is locked while a toggle
// is on its way, and a click of a guest sends nothing. It says what a click
// will do; on mobile only its heart shows.
export function createFavoriteButton(options: FavoriteButtonOptions): HTMLButtonElement {
  const state: { isFavorite: boolean; isPending: boolean } = {
    isFavorite: options.game.isLikedByCurrentUser,
    isPending: false,
  };

  const text: HTMLSpanElement = createElement('span', {
    className: 'game-details__favorite-text',
  });
  const button: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Medium,
    className: 'game-details__favorite',
    children: [createIcon(IconName.Heart), text],
  });

  const show = (): void => {
    text.textContent = state.isFavorite
      ? GAME_DETAILS_CONTENT.removeFavoriteLabel
      : GAME_DETAILS_CONTENT.addFavoriteLabel;
    button.classList.toggle('game-details__favorite--active', state.isFavorite);
  };

  const setPending = (isPending: boolean): void => {
    state.isPending = isPending;
    setButtonBusy(button, isPending);
  };

  const toggle = async (session: AppSession): Promise<void> => {
    setPending(true);
    try {
      const result: FavoriteState = await toggleFavorite(options.game.slug, session.email);
      state.isFavorite = result.isFavorited;
      show();
      options.onLikesChange(result.likesCount);
      showSnackbar({
        variant: SnackbarVariant.Success,
        text: result.isFavorited ? MESSAGES.added : MESSAGES.removed,
      });
    } catch (error: unknown) {
      // A refusal of the server, such as a rate limit, says why; any other
      // failure may have changed the favorite all the same
      if (error instanceof ApiError && !isOutcomeUnknown(error)) {
        showSnackbar({ variant: SnackbarVariant.Error, text: error.message });
      } else {
        showSnackbar({ variant: SnackbarVariant.Warning, text: MESSAGES.unconfirmed });
        options.onUnconfirmed();
      }
    } finally {
      setPending(false);
    }
  };

  button.addEventListener('click', (): void => {
    if (state.isPending) {
      return;
    }
    const session: AppSession | undefined = options.requireSession(MESSAGES.loginWarning);
    if (session !== undefined) {
      void toggle(session);
    }
  });

  show();

  return button;
}
