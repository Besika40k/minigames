import { fetchUserRecords } from '../../../api/profile-api.ts';
import { createButtonLink } from '../../../components/button/button.ts';
import { createAsyncArea, type AsyncArea } from '../../../components/feedback/async-area.ts';
import { createEmptyState } from '../../../components/feedback/empty-state.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { createSkeleton } from '../../../components/skeleton/skeleton.ts';
import { GAME_DETAILS_CONTENT } from '../../../data/game-details.ts';
import { OWN_GAMES } from '../../../data/own-games.ts';
import { PROFILE_CONTENT } from '../../../data/profile.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import type { UserRecord } from '../../../types/profile.ts';
import { createElement } from '../../../utils/create-element.ts';
import { formatNumber } from '../../../utils/format-number.ts';
import { formatRelativeTime } from '../../../utils/format-relative-time.ts';
import './profile-records.scss';

const TITLE_ID = 'profile-records-title';

// The skeleton holds the place of the records of the three difficulties
const SKELETON_ROWS = 3;

export interface ProfileRecords {
  readonly element: HTMLElement;
  // Cancels the request when the page closes
  readonly abort: () => void;
}

// One best score: the game and the difficulty, the score, and how long ago
function createRow(record: UserRecord): HTMLLIElement {
  const date: HTMLTimeElement = createElement('time', {
    className: 'profile-records__date',
    text: formatRelativeTime(new Date(record.achievedAt)),
    attributes: { datetime: record.achievedAt },
  });

  return createElement('li', {
    className: 'profile-records__row',
    children: [
      createElement('span', { className: 'profile-records__game', text: record.gameName }),
      createElement('span', { className: 'profile-records__detail', text: record.detail }),
      createElement('span', {
        className: 'profile-records__score',
        text: `${formatNumber(record.score)} ${GAME_DETAILS_CONTENT.pointsSuffix}`,
      }),
      date,
    ],
  });
}

function createSkeletonList(): readonly Node[] {
  return [
    createElement('ul', {
      className: 'profile-records__list',
      attributes: { 'aria-hidden': 'true' },
      children: Array.from({ length: SKELETON_ROWS }, (): HTMLLIElement =>
        createElement('li', { children: [createSkeleton('profile-records__skeleton')] }),
      ),
    }),
  ];
}

// No record yet: an invitation to play the game that sends them
function createNoRecords(): readonly Node[] {
  const [game] = OWN_GAMES;
  const action: HTMLAnchorElement | undefined =
    game === undefined
      ? undefined
      : createButtonLink({
          variant: ButtonVariant.Filled,
          size: ButtonSize.Medium,
          text: PROFILE_CONTENT.playText,
          href: game.playUrl,
        });

  return [
    createEmptyState({
      title: PROFILE_CONTENT.noRecordsTitle,
      message: PROFILE_CONTENT.noRecordsMessage,
      action,
    }),
  ];
}

// The best scores of the user in the games of MiniGames itself, which the
// games send to Firestore when a signed-in player finishes
export function createProfileRecords(userEmail: string): ProfileRecords {
  const content: HTMLDivElement = createElement('div', {
    className: 'profile-records__content',
  });

  const area: AsyncArea = createAsyncArea({
    container: content,
    messages: PROFILE_CONTENT.recordsMessages,
    load: (): Promise<readonly UserRecord[]> => fetchUserRecords(userEmail),
    renderSkeleton: createSkeletonList,
    renderData: (records: readonly UserRecord[]): readonly Node[] => [
      createElement('ol', {
        className: 'profile-records__list',
        children: records.map((record: UserRecord): HTMLLIElement => createRow(record)),
      }),
    ],
    isEmpty: (records: readonly UserRecord[]): boolean => records.length === 0,
    renderEmpty: createNoRecords,
  });
  area.reload();

  const element: HTMLElement = createElement('section', {
    className: 'profile-records',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [createSectionTitle(TITLE_ID, [PROFILE_CONTENT.recordsTitle]), content],
  });

  return {
    element,
    abort: (): void => {
      area.abort();
    },
  };
}
