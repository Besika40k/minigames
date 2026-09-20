import flameUrl from '../../../assets/images/flame.png';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import {
  LEADERBOARD_COLUMNS,
  LEADERBOARD_ENTRIES,
  LEADERBOARD_TITLE,
} from '../../../data/leaderboard.ts';
import {
  LeaderboardColumn,
  type LeaderboardColumnContent,
  type LeaderboardEntry,
  type ResponsiveText,
} from '../../../types/leaderboard.ts';
import { createElement } from '../../../utils/create-element.ts';
import { formatCompactNumber, formatNumber } from '../../../utils/format-number.ts';
import { getInitials } from '../../../utils/get-initials.ts';
import './leaderboard.scss';

const TITLE_ID = 'leaderboard-title';

// The flame's own size, so the browser can reserve its space
const FLAME_SIZE = '32';

// The screen width up to which a text shows its short form
enum SwitchPoint {
  Laptop = 'laptop',
  Mobile = 'mobile',
}

function createForm(
  form: 'long' | 'short',
  text: string,
  switchPoint: SwitchPoint,
): HTMLSpanElement {
  return createElement('span', {
    className: `leaderboard__${form} leaderboard__${form}--${switchPoint}`,
    text,
  });
}

// Both forms are in the page and CSS shows one of them. A form that CSS hides
// is also hidden from screen readers, so each screen reads one text.
function createResponsiveText(text: ResponsiveText, switchPoint: SwitchPoint): readonly Node[] {
  return text.short === undefined
    ? [document.createTextNode(text.long)]
    : [createForm('long', text.long, switchPoint), createForm('short', text.short, switchPoint)];
}

function createHeaderCell(content: LeaderboardColumnContent): HTMLTableCellElement {
  return createElement('th', {
    className: `leaderboard__cell leaderboard__cell--${content.column}`,
    attributes: { scope: 'col' },
    children: createResponsiveText(content.label, SwitchPoint.Laptop),
  });
}

function createHeader(): HTMLTableSectionElement {
  const cells: HTMLTableCellElement[] = LEADERBOARD_COLUMNS.map(
    (content: LeaderboardColumnContent): HTMLTableCellElement => createHeaderCell(content),
  );

  return createElement('thead', {
    className: 'leaderboard__head',
    children: [createElement('tr', { children: cells })],
  });
}

function createCell(
  column: LeaderboardColumn,
  children: readonly (Node | string)[],
): HTMLTableCellElement {
  return createElement('td', {
    className: `leaderboard__cell leaderboard__cell--${column}`,
    children,
  });
}

// The player's name identifies the row, so it is the row's header cell
function createPlayerCell(entry: LeaderboardEntry): HTMLTableCellElement {
  const avatar: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__avatar',
    text: getInitials(entry.playerName),
    attributes: { 'aria-hidden': 'true' },
  });
  const name: HTMLSpanElement = createElement('span', { text: entry.playerName });
  const player: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__player',
    children: [avatar, name],
  });

  return createElement('th', {
    className: `leaderboard__cell leaderboard__cell--${LeaderboardColumn.Player}`,
    attributes: { scope: 'row' },
    children: [player],
  });
}

function createScoreCell(entry: LeaderboardEntry): HTMLTableCellElement {
  const score: ResponsiveText = {
    long: formatNumber(entry.totalScore),
    short: formatCompactNumber(entry.totalScore),
  };

  return createCell(LeaderboardColumn.Score, createResponsiveText(score, SwitchPoint.Mobile));
}

function createStreakCell(entry: LeaderboardEntry): HTMLTableCellElement {
  const flame: HTMLImageElement = createElement('img', {
    className: 'leaderboard__flame',
    attributes: { src: flameUrl, alt: '', width: FLAME_SIZE, height: FLAME_SIZE },
  });
  const days: ResponsiveText = {
    long: `${entry.streakDays} ${entry.streakDays === 1 ? 'day' : 'days'}`,
    short: `${entry.streakDays}d`,
  };
  const streak: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__streak',
    children: [flame, ...createResponsiveText(days, SwitchPoint.Laptop)],
  });

  return createCell(LeaderboardColumn.Streak, [streak]);
}

function createFavoriteCell(entry: LeaderboardEntry): HTMLTableCellElement {
  const tag: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__tag',
    text: entry.favoriteGameName,
  });

  return createCell(LeaderboardColumn.Favorite, [tag]);
}

function createRow(entry: LeaderboardEntry): HTMLTableRowElement {
  return createElement('tr', {
    className: 'leaderboard__row',
    children: [
      createCell(LeaderboardColumn.Rank, [`#${entry.rank}`]),
      createPlayerCell(entry),
      createCell(LeaderboardColumn.Games, [formatNumber(entry.gamesPlayed)]),
      createScoreCell(entry),
      createStreakCell(entry),
      createFavoriteCell(entry),
    ],
  });
}

function createTable(): HTMLTableElement {
  const rows: HTMLTableRowElement[] = LEADERBOARD_ENTRIES.map(
    (entry: LeaderboardEntry): HTMLTableRowElement => createRow(entry),
  );
  const body: HTMLTableSectionElement = createElement('tbody', {
    className: 'leaderboard__body',
    children: rows,
  });

  return createElement('table', {
    className: 'leaderboard__table',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [createHeader(), body],
  });
}

export function createLeaderboard(): HTMLElement {
  const title: HTMLHeadingElement = createSectionTitle(
    TITLE_ID,
    createResponsiveText(LEADERBOARD_TITLE, SwitchPoint.Mobile),
  );
  // The wrapper draws the table's border, corners and shadow, and clips the
  // header's background to the corners
  const wrapper: HTMLDivElement = createElement('div', {
    className: 'leaderboard__table-wrapper',
    children: [createTable()],
  });
  const inner: HTMLDivElement = createElement('div', {
    className: 'leaderboard__inner',
    children: [title, wrapper],
  });

  return createElement('section', {
    className: 'leaderboard',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
