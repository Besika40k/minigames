import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import type { GameComment, GameDetailsSection } from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import './game-details-comments.scss';

const TITLE_ID = 'game-details-comments-title';
const INPUT_ID = 'game-details-comment-input';

// A round avatar with the first letter of a name. It is decoration: the name
// is written next to it.
function createAvatar(name: string, className: string): HTMLSpanElement {
  return createElement('span', {
    className,
    text: name.charAt(0).toUpperCase(),
    attributes: { 'aria-hidden': 'true' },
  });
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

// The comments of the game: the heading and the form for a new one. The text
// in the form is cleared whenever the dialog opens.
export function createGameDetailsComments(comments: readonly GameComment[]): GameDetailsSection {
  const form: GameDetailsSection = createCommentForm();

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
    ],
  });

  return { element, reset: form.reset };
}
