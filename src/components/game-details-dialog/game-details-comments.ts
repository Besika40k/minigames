import { fetchGameComments } from '../../api/comments-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import type {
  GameComment,
  GameCommentsPage,
  GameCommentsSection,
} from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createElement } from '../../utils/create-element.ts';
import { formatRelativeTime } from '../../utils/format-relative-time.ts';
import { createAsyncArea, type AsyncArea } from '../feedback/async-area.ts';
import { createEmptyState } from '../feedback/empty-state.ts';
import { createSkeleton } from '../skeleton/skeleton.ts';
import { createCommentForm, type CommentForm } from './game-details-comment-form.ts';
import { createLikeButton, type LikeButtonOptions } from './game-details-like.ts';
import './game-details-comments.scss';

const TITLE_ID = 'game-details-comments-title';

// The API sends at most three comments, and the skeleton holds their place
const SKELETON_COMMENTS = 3;

// A round avatar with the first letter of a name. It is decoration: the name
// is written next to it.
function createAvatar(name: string, className: string): HTMLSpanElement {
  return createElement('span', {
    className,
    text: name.charAt(0).toUpperCase(),
    attributes: { 'aria-hidden': 'true' },
  });
}

// What a list of comments needs besides the comments
type CommentListOptions = Omit<LikeButtonOptions, 'comment'>;

function createComment(comment: GameComment, options: CommentListOptions): HTMLLIElement {
  const nameId: string = `game-details-comment-${comment.commentId}`;
  const date: HTMLTimeElement = createElement('time', {
    className: 'game-details__comment-date',
    text: formatRelativeTime(new Date(comment.createdAt)),
    attributes: { datetime: comment.createdAt },
  });

  const header: HTMLDivElement = createElement('div', {
    className: 'game-details__comment-header',
    children: [
      createAvatar(comment.authorName, 'game-details__avatar'),
      createElement('h4', {
        className: 'game-details__author',
        text: comment.authorName,
        attributes: { id: nameId },
      }),
      date,
    ],
  });

  const article: HTMLElement = createElement('article', {
    className: 'game-details__comment',
    attributes: { 'aria-labelledby': nameId },
    children: [
      header,
      createElement('p', { className: 'game-details__comment-text', text: comment.text }),
      createLikeButton({ ...options, comment }),
    ],
  });

  return createElement('li', { children: [article] });
}

function createSkeletonList(): HTMLElement {
  return createElement('div', {
    className: 'game-details__comments-list',
    children: Array.from({ length: SKELETON_COMMENTS }, (): HTMLSpanElement =>
      createSkeleton('game-details__skeleton-comment'),
    ),
  });
}

function createCommentList(
  comments: readonly GameComment[],
  options: CommentListOptions,
): HTMLUListElement {
  return createElement('ul', {
    className: 'game-details__comments-list',
    children: comments.map((comment: GameComment): HTMLLIElement =>
      createComment(comment, options),
    ),
  });
}

export interface GameCommentsOptions {
  // The signed-in user, or undefined for a guest
  readonly getSession: () => AppSession | undefined;
  // Checks the session before a comment is sent or liked
  readonly requireSession: (warning: string) => AppSession | undefined;
}

// The comments of a game: the form for a new one, and the latest comments
// from the API with the total count in the heading. Every game starts with an
// empty form and the likes as the API sends them for the current visitor.
export function createGameDetailsComments(options: GameCommentsOptions): GameCommentsSection {
  // The slug whose comments are on the screen or on their way
  let slug: string = '';

  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-details__subtitle',
    text: GAME_DETAILS_CONTENT.commentsTitle,
    attributes: { id: TITLE_ID },
  });
  // The heading counts every comment of the game, not only the shown ones
  const showCount = (page: GameCommentsPage): void => {
    title.textContent = `${GAME_DETAILS_CONTENT.commentsTitle} (${String(page.totalComments)})`;
  };

  // The comments, or their skeleton, the error banner or the empty placeholder
  const list: HTMLDivElement = createElement('div', { className: 'game-details__comments-area' });

  const area: AsyncArea = createAsyncArea({
    container: list,
    messages: GAME_DETAILS_CONTENT.commentsMessages,
    load: (signal: AbortSignal): Promise<GameCommentsPage> =>
      fetchGameComments(slug, signal, options.getSession()?.email),
    renderSkeleton: (): readonly Node[] => {
      title.textContent = GAME_DETAILS_CONTENT.commentsTitle;
      return [createSkeletonList()];
    },
    renderData: (page: GameCommentsPage): readonly Node[] => [
      createCommentList(page.comments, {
        requireSession: options.requireSession,
        onUnconfirmed: (): void => {
          area.reload();
        },
      }),
    ],
    isEmpty: (page: GameCommentsPage): boolean => page.comments.length === 0,
    renderEmpty: (): readonly Node[] => [
      createEmptyState({
        title: GAME_DETAILS_CONTENT.noCommentsTitle,
        message: GAME_DETAILS_CONTENT.noCommentsMessage,
      }),
    ],
    // An unknown game hides the whole section (see the dialog)
    renderNotFound: (): readonly Node[] => [],
    onLoad: showCount,
  });

  // A sent comment, or one that may have been sent, shows in the list loaded
  // again, with the new total in the heading
  const form: CommentForm = createCommentForm({
    requireSession: options.requireSession,
    onSent: (): void => {
      area.reload();
    },
  });

  const element: HTMLElement = createElement('section', {
    className: 'game-details__comments',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [title, form.element, list],
  });

  return {
    element,
    show: (nextSlug: string): void => {
      slug = nextSlug;
      form.show(slug, options.getSession());
      area.reload();
    },
    abort: (): void => {
      area.abort();
    },
  };
}
