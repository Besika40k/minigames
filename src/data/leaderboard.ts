import {
  LeaderboardColumn,
  type LeaderboardColumnContent,
  type ResponsiveText,
} from '../types/leaderboard.ts';

// Mobile leaves off the end of the title, and tablet and mobile shorten two of
// the column titles
export const LEADERBOARD_TITLE: ResponsiveText = {
  long: 'Top Players This Week',
  short: 'Top Players',
};

export const LEADERBOARD_COLUMNS: readonly LeaderboardColumnContent[] = [
  { column: LeaderboardColumn.Rank, label: { long: 'Rank' } },
  { column: LeaderboardColumn.Player, label: { long: 'Player' } },
  { column: LeaderboardColumn.Games, label: { long: 'Games Played', short: 'Games' } },
  { column: LeaderboardColumn.Score, label: { long: 'Total Score', short: 'Score' } },
  { column: LeaderboardColumn.Streak, label: { long: 'Streak' } },
  { column: LeaderboardColumn.Favorite, label: { long: 'Favorite Game' } },
];
