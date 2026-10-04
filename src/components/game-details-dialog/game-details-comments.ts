import { fetchGameComments } from '../../api/comments-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import type {
  GameComment,
  GameCommentsPage,
  GameCommentsSection,
  GameDetailsSection,
} from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { formatRelativeTime } from '../../utils/format-relative-time.ts';
import { createAsyncArea, type AsyncArea } from '../feedback/async-area.ts';
import { createEmptyState } from '../feedback/empty-state.ts';
import { createSkeleton } from '../skeleton/skeleton.ts';
import './game-details-comments.scss';

const TITLE_ID = 'game-details-comments-title';
const INPUT_ID = 'game-details-comment-input';

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

// The heart and the number of likes. A click likes or unlikes the comment and
// changes the number by one; nothing is sent anywhere yet.
function createLikeButton(comment: GameComment): GameDetailsSection {
  // The API counts the current user's like in the total
  const othersLikes: number = comment.likesCount - (comment.isLikedByCurrentUser ? 1 : 0);
  let isLiked: boolean = comment.isLikedByCurrentUser;

  const count: HTMLSpanElement = createElement('span');
  const element: HTMLButtonElement = createElement('button', {
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
    element.setAttribute('aria-pressed', String(isLiked));
    count.textContent = String(othersLikes + (isLiked ? 1 : 0));
  };

  element.addEventListener('click', (): void => {
    isLiked = !isLiked;
    show();
  });

  const reset = (): void => {
    isLiked = comment.isLikedByCurrentUser;
    show();
  };
  reset();

  return { element, reset };
}

function createComment(comment: GameComment, likeButton: HTMLElement): HTMLLIElement {
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
      likeButton,
    ],
  });

  return createElement('li', { children: [article] });
}

// The form for a new comment: the textarea grows with its text (see the
// styles) and the send button works only when there is something to send.
// Sending comes in a later story, so the form does nothing yet.
function createCommentForm(): GameDetailsSection {
  const label: HTMLLabelElement = createElement('label', {
    className: 'game-details__hidden',
    text: GAME_DETAILS_CONTENT.commentLabel,
    attributes: { for: INPUT_ID },
  });

  const input: HTMLTextAreaElement = createElement('textarea', {
    className: 'game-details__comment-input',
    attributes: {
      id: INPUT_ID,
      name: 'comment',
      rows: '1',
      placeholder: GAME_DETAILS_CONTENT.commentPlaceholder,
    },
  });

  const sendButton: HTMLButtonElement = createElement('button', {
    className: 'game-details__send',
    attributes: { type: 'submit', 'aria-label': GAME_DETAILS_CONTENT.sendLabel },
    children: [createIcon(IconName.Send)],
  });

  const element: HTMLFormElement = createElement('form', {
    className: 'game-details__comment-form',
    attributes: { novalidate: '' },
    children: [
      createAvatar(GAME_DETAILS_CONTENT.currentUserInitial, 'game-details__user'),
      label,
      input,
      sendButton,
    ],
  });

  const updateSendButton = (): void => {
    sendButton.disabled = input.value.trim() === '';
  };
  input.addEventListener('input', updateSendButton);

  element.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
  });

  const reset = (): void => {
    input.value = '';
    updateSendButton();
  };
  reset();

  return { element, reset };
}

function createSkeletonList(): HTMLElement {
  return createElement('div', {
    className: 'game-details__comments-list',
    children: Array.from({ length: SKELETON_COMMENTS }, (): HTMLSpanElement =>
      createSkeleton('game-details__skeleton-comment'),
    ),
  });
}

function createCommentList(comments: readonly GameComment[]): HTMLUListElement {
  return createElement('ul', {
    className: 'game-details__comments-list',
    children: comments.map((comment: GameComment): HTMLLIElement =>
      createComment(comment, createLikeButton(comment).element),
    ),
  });
}

// The comments of a game: the form for a new one, and the latest comments
// from the API with the total count in the heading. Every game starts with an
// empty form and the likes as the API sends them.
export function createGameDetailsComments(): GameCommentsSection {
  // The slug whose comments are on the screen or on their way
  let slug: string = '';

  const form: GameDetailsSection = createCommentForm();
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
    load: (signal: AbortSignal): Promise<GameCommentsPage> => fetchGameComments(slug, signal),
    renderSkeleton: (): readonly Node[] => {
      title.textContent = GAME_DETAILS_CONTENT.commentsTitle;
      return [createSkeletonList()];
    },
    renderData: (page: GameCommentsPage): readonly Node[] => [createCommentList(page.comments)],
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

  const element: HTMLElement = createElement('section', {
    className: 'game-details__comments',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [title, form.element, list],
  });

  return {
    element,
    show: (nextSlug: string): void => {
      slug = nextSlug;
      form.reset();
      area.reload();
    },
    abort: (): void => {
      area.abort();
    },
  };
}
