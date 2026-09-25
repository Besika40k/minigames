import { createButton } from '../../../components/button/button.ts';
import illustrationUrl from '../../../assets/images/game-developer-illustration.jpg';
import { GAME_DEVELOPERS_CONTENT } from '../../../data/game-developers.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import { createElement } from '../../../utils/create-element.ts';
import { createIcon, IconName } from '../../../utils/create-icon.ts';
import './game-developers.scss';

const TITLE_ID = 'game-developers-title';

// The illustration's own size, so the browser can reserve its space
const ILLUSTRATION_WIDTH = '719';
const ILLUSTRATION_HEIGHT = '517';

// The lines are joined by a space and a line break: the styles drop the breaks
// when the card is too narrow, and the space keeps the words apart then
function createDescription(): HTMLParagraphElement {
  const lines: Node[] = GAME_DEVELOPERS_CONTENT.descriptionLines.flatMap(
    (line: string, index: number): Node[] =>
      index === 0
        ? [document.createTextNode(line)]
        : [document.createTextNode(' '), createElement('br'), document.createTextNode(line)],
  );

  return createElement('p', { className: 'game-developers__description', children: lines });
}

function createSubmitButton(): HTMLButtonElement {
  // The button does nothing yet: the submission form is not part of Story 1.
  return createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Large,
    className: 'game-developers__button',
    children: [
      createIcon(IconName.Upload),
      createElement('span', { text: GAME_DEVELOPERS_CONTENT.buttonText }),
    ],
  });
}

export function createGameDevelopers(): HTMLElement {
  const illustration: HTMLImageElement = createElement('img', {
    className: 'game-developers__illustration',
    attributes: {
      src: illustrationUrl,
      alt: '',
      width: ILLUSTRATION_WIDTH,
      height: ILLUSTRATION_HEIGHT,
    },
  });

  const card: HTMLDivElement = createElement('div', {
    className: 'game-developers__card',
    children: [
      createElement('h2', {
        className: 'game-developers__title',
        text: GAME_DEVELOPERS_CONTENT.title,
        attributes: { id: TITLE_ID },
      }),
      createDescription(),
      createSubmitButton(),
      createElement('p', {
        className: 'game-developers__contact',
        text: GAME_DEVELOPERS_CONTENT.contact,
      }),
    ],
  });

  const inner: HTMLDivElement = createElement('div', {
    className: 'game-developers__inner',
    children: [illustration, card],
  });

  return createElement('section', {
    className: 'game-developers',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
