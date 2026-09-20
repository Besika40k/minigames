// A text in two lengths. Small screens show the short one; when there is none,
// every screen shows the long one.
export interface ResponsiveText {
  readonly long: string;
  readonly short?: string;
}

// The values double as the suffix of the CSS class that sizes the column
export enum LeaderboardColumn {
  Rank = 'rank',
  Player = 'player',
  Games = 'games',
  Score = 'score',
  Streak = 'streak',
  Favorite = 'favorite',
}

export interface LeaderboardColumnContent {
  readonly column: LeaderboardColumn;
  readonly label: ResponsiveText;
}

// One row of the table, with the field names of the course's mock dataset
export interface LeaderboardEntry {
  readonly rank: number;
  readonly playerName: string;
  readonly gamesPlayed: number;
  readonly totalScore: number;
  readonly streakDays: number;
  readonly favoriteGameSlug: string;
  readonly favoriteGameName: string;
}
