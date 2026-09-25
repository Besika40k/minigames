import { GAME_DETAILS_CONTENT, STATIC_GAME_DETAILS } from '../../data/game-details.ts';
import type {
  GameDetails,
  GameDetailsDialog,
  GameDetailsSection,
} from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { enableDialogDismiss } from '../../utils/dismiss-dialog.ts';
import './game-details-dialog.scss';
import { createGameDetailsInfo } from './game-details-info.ts';
import { createGameDetailsRecords } from './game-details-records.ts';

// The size of the hero picture, so the browser can reserve its space
const HERO_WIDTH = '1920';
const HERO_HEIGHT = '1080';

const TITLE_ID = 'game-details-title';

// The cover picture of the game and the button that closes the dialog. The
// picture is decoration: the dialog is named by the game's title.
function createHero(game: GameDetails, onClose: () => void): HTMLElement {
  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'game-details__close',
    attributes: { type: 'button', 'aria-label': GAME_DETAILS_CONTENT.closeLabel },
    children: [createIcon(IconName.Dismiss)],
  });
  closeButton.addEventListener('click', onClose);

  return createElement('div', {
    className: 'game-details__hero',
    children: [
      createElement('img', {
        className: 'game-details__image',
        attributes: { src: game.heroImage, alt: '', width: HERO_WIDTH, height: HERO_HEIGHT },
      }),
      closeButton,
    ],
  });
}

// The dialog with the details of a game. Every card opens the same static game
// for now.
export function createGameDetailsDialog(): GameDetailsDialog {
  const game: GameDetails = STATIC_GAME_DETAILS;

  const dialog: HTMLDialogElement = createElement('dialog', {
    className: 'game-details',
    attributes: { 'aria-labelledby': TITLE_ID },
  });

  const close = (): void => {
    dialog.close();
  };

  const info: GameDetailsSection = createGameDetailsInfo(game, TITLE_ID);
  const content: HTMLDivElement = createElement('div', {
    className: 'game-details__content',
    children: [info.element, createGameDetailsRecords(game)],
  });
  dialog.append(createHero(game, close), content);
  enableDialogDismiss(dialog);

  // Nothing the visitor changed inside is kept: every opening starts afresh
  const open = (): void => {
    info.reset();
    if (!dialog.open) {
      dialog.showModal();
    }
    // A long dialog opens at its top, even if it was scrolled when it closed
    dialog.scrollTop = 0;
  };

  return { element: dialog, open };
}
