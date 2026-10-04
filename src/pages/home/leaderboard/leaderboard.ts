import { fetchLeaderboard } from '../../../api/leaderboard-api.ts';
import flameUrl from '../../../assets/images/flame.png';
import { createAsyncArea, type AsyncArea } from '../../../components/feedback/async-area.ts';
import { createEmptyState } from '../../../components/feedback/empty-state.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { createSkeleton } from '../../../components/skeleton/skeleton.ts';
import {
  LEADERBOARD_COLUMNS,
  LEADERBOARD_EMPTY_STATE,
  LEADERBOARD_MESSAGES,
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

// The API returns the top five players, and the skeleton holds their place
const SKELETON_ROWS = 5;

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

// A grey cell in the shape of a real one: the player cell holds an avatar
// circle and a bar, the other cells a bar each
function createSkeletonCell(column: LeaderboardColumn): HTMLTableCellElement {
  const bar: HTMLSpanElement = createSkeleton('leaderboard__skeleton-text');
  if (column !== LeaderboardColumn.Player) {
    return createCell(column, [bar]);
  }

  const player: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__player',
    children: [createSkeleton('leaderboard__skeleton-avatar'), bar],
  });

  return createCell(column, [player]);
}

function createSkeletonRow(): HTMLTableRowElement {
  const cells: HTMLTableCellElement[] = LEADERBOARD_COLUMNS.map(
    (content: LeaderboardColumnContent): HTMLTableCellElement => createSkeletonCell(content.column),
  );

  return createElement('tr', {
    className: 'leaderboard__row',
    attributes: { 'aria-hidden': 'true' },
    children: cells,
  });
}

// The wrapper draws the table's border, corners and shadow, and clips the
// header's background to the corners
function createTable(rows: readonly HTMLTableRowElement[]): HTMLDivElement {
  const body: HTMLTableSectionElement = createElement('tbody', {
    className: 'leaderboard__body',
    children: rows,
  });
  const table: HTMLTableElement = createElement('table', {
    className: 'leaderboard__table',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [createHeader(), body],
  });

  return createElement('div', { className: 'leaderboard__table-wrapper', children: [table] });
}

export interface Leaderboard {
  readonly element: HTMLElement;
  // Cancels the request when the page closes
  readonly destroy: () => void;
}

// The table of the week's top players, loaded from the API. While it loads,
// the table shows its header over grey rows.
export function createLeaderboard(): Leaderboard {
  const title: HTMLHeadingElement = createSectionTitle(
    TITLE_ID,
    createResponsiveText(LEADERBOARD_TITLE, SwitchPoint.Mobile),
  );
  // The table, or the error banner or the empty placeholder in its place
  const content: HTMLDivElement = createElement('div', { className: 'leaderboard__content' });
  const inner: HTMLDivElement = createElement('div', {
    className: 'leaderboard__inner',
    children: [title, content],
  });

  const area: AsyncArea = createAsyncArea({
    container: content,
    messages: LEADERBOARD_MESSAGES,
    load: fetchLeaderboard,
    renderSkeleton: (): readonly Node[] => {
      const rows: HTMLTableRowElement[] = Array.from(
        { length: SKELETON_ROWS },
        (): HTMLTableRowElement => createSkeletonRow(),
      );

      return [createTable(rows)];
    },
    renderData: (entries: readonly LeaderboardEntry[]): readonly Node[] => [
      createTable(entries.map((entry: LeaderboardEntry): HTMLTableRowElement => createRow(entry))),
    ],
    isEmpty: (entries: readonly LeaderboardEntry[]): boolean => entries.length === 0,
    renderEmpty: (): readonly Node[] => [createEmptyState(LEADERBOARD_EMPTY_STATE)],
  });
  area.reload();

  const element: HTMLElement = createElement('section', {
    className: 'leaderboard',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });

  return {
    element,
    destroy: (): void => {
      area.abort();
    },
  };
}
