import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import type { GameDetails, TopRecord } from '../../types/game-details.ts';
import { createElement } from '../../utils/create-element.ts';
import { formatNumber } from '../../utils/format-number.ts';
import { formatRelativeTime } from '../../utils/format-relative-time.ts';
import './game-details-records.scss';

const TITLE_ID = 'game-details-records-title';

// A player's place, name, score and how long ago it was reached. The medal is
// decoration: the list is ordered, so the place is read out anyway.
function createRecord(record: TopRecord): HTMLLIElement {
  const medal: string = GAME_DETAILS_CONTENT.medals[record.position - 1] ?? '';
  const date: HTMLTimeElement = createElement('time', {
    className: 'game-details__date',
    text: formatRelativeTime(new Date(record.achievedAt)),
    attributes: { datetime: record.achievedAt },
  });

  return createElement('li', {
    className: 'game-details__record',
    children: [
      createElement('span', {
        className: 'game-details__medal',
        text: medal,
        attributes: { 'aria-hidden': 'true' },
      }),
      createElement('span', { className: 'game-details__player', text: record.playerName }),
      createElement('span', {
        className: 'game-details__score',
        text: `${formatNumber(record.score)} ${GAME_DETAILS_CONTENT.pointsSuffix}`,
      }),
      date,
    ],
  });
}

// The best scores of the game. Nothing here can be clicked.
export function createGameDetailsRecords(game: GameDetails): HTMLElement {
  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-details__subtitle',
    attributes: { id: TITLE_ID },
    children: [
      createElement('span', {
        className: 'game-details__subtitle-icon',
        text: GAME_DETAILS_CONTENT.recordsIcon,
        attributes: { 'aria-hidden': 'true' },
      }),
      GAME_DETAILS_CONTENT.recordsTitle,
    ],
  });

  const list: HTMLOListElement = createElement('ol', {
    className: 'game-details__records-list',
    children: game.topRecords.map((record: TopRecord): HTMLLIElement => createRecord(record)),
  });

  return createElement('section', {
    className: 'game-details__records',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [title, list],
  });
}
