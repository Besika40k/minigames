import { ApiError, isOutcomeUnknown } from '../../api/api-error.ts';
import { toggleCommentLike } from '../../api/likes-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import { SnackbarVariant, type ChangeMessages } from '../../types/feedback.ts';
import type { CommentLikeState, GameComment } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { setButtonBusy } from '../button/button.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';

const MESSAGES: ChangeMessages = GAME_DETAILS_CONTENT.likeMessages;

export interface LikeButtonOptions {
  readonly comment: GameComment;
  // Checks the session before a like. A guest gets undefined, and the auth
  // dialog in place of Game Details.
  readonly requireSession: (warning: string) => AppSession | undefined;
  // A like whose outcome is unknown: the comments load again instead of a
  // second toggle, which could undo the first
  readonly onUnconfirmed: () => void;
}

// The heart and the number of likes of a comment. It starts from the state the
// server sent for the visitor and shows only what the server confirms: it is
// locked while a toggle is on its way, and a click of a guest sends nothing.
export function createLikeButton(options: LikeButtonOptions): HTMLButtonElement {
  const state: { isLiked: boolean; likesCount: number; isPending: boolean } = {
    isLiked: options.comment.isLikedByCurrentUser,
    likesCount: options.comment.likesCount,
    isPending: false,
  };

  const count: HTMLSpanElement = createElement('span');
  const button: HTMLButtonElement = createElement('button', {
    className: 'game-details__like',
    attributes: { type: 'button' },
    children: [
      createIcon(IconName.Heart),
      createElement('span', {
        className: 'game-details__hidden',
        text: `${GAME_DETAILS_CONTENT.likesLabel}: `,
      }),
      count,
    ],
  });

  const show = (): void => {
    button.setAttribute('aria-pressed', String(state.isLiked));
    count.textContent = String(state.likesCount);
  };

  const setPending = (isPending: boolean): void => {
    state.isPending = isPending;
    setButtonBusy(button, isPending);
  };

  const toggle = async (session: AppSession): Promise<void> => {
    setPending(true);
    try {
      const result: CommentLikeState = await toggleCommentLike(
        options.comment.commentId,
        session.email,
      );
      state.isLiked = result.isLikedByCurrentUser;
      state.likesCount = result.likesCount;
      show();
    } catch (error: unknown) {
      // A refusal of the server, such as a rate limit, says why; any other
      // failure may have changed the like all the same
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
