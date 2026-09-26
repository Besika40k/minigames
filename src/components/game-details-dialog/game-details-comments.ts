import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import type { GameComment, GameDetailsSection } from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { formatRelativeTime } from '../../utils/format-relative-time.ts';
import './game-details-comments.scss';

const TITLE_ID = 'game-details-comments-title';
const INPUT_ID = 'game-details-comment-input';

interface CommentEntry {
  readonly item: HTMLLIElement;
  readonly likeButton: GameDetailsSection;
}

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
  // The mock data counts the current user's like in the total
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

// The comments of the game: the form for a new one and the list. The likes
// and the text in the form go back to how they were whenever the dialog opens.
export function createGameDetailsComments(comments: readonly GameComment[]): GameDetailsSection {
  const form: GameDetailsSection = createCommentForm();
  const entries: CommentEntry[] = comments.map((comment: GameComment): CommentEntry => {
    const likeButton: GameDetailsSection = createLikeButton(comment);
    return { item: createComment(comment, likeButton.element), likeButton };
  });

  const element: HTMLElement = createElement('section', {
    className: 'game-details__comments',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [
      createElement('h3', {
        className: 'game-details__subtitle',
        text: `${GAME_DETAILS_CONTENT.commentsTitle} (${String(comments.length)})`,
        attributes: { id: TITLE_ID },
      }),
      form.element,
      createElement('ul', {
        className: 'game-details__comments-list',
        children: entries.map((entry: CommentEntry): HTMLLIElement => entry.item),
      }),
    ],
  });

  const reset = (): void => {
    form.reset();
    for (const entry of entries) {
      entry.likeButton.reset();
    }
  };

  return { element, reset };
}
