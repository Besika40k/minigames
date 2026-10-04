import type { LeaderboardEntry } from '../types/leaderboard.ts';
import { isNumber, isRecord, isString } from './guards.ts';
import { getJson } from './http-client.ts';
import { createInvalidResponseError, readList } from './response.ts';

function toLeaderboardEntry(value: unknown): LeaderboardEntry {
  if (!isRecord(value)) {
    throw createInvalidResponseError();
  }
  const {
    rank,
    playerName,
    gamesPlayed,
    totalScore,
    streakDays,
    favoriteGameSlug,
    favoriteGameName,
  } = value;
  if (
    !isNumber(rank) ||
    !isString(playerName) ||
    !isNumber(gamesPlayed) ||
    !isNumber(totalScore) ||
    !isNumber(streakDays) ||
    !isString(favoriteGameSlug) ||
    !isString(favoriteGameName)
  ) {
    throw createInvalidResponseError();
  }

  return {
    rank,
    playerName,
    gamesPlayed,
    totalScore,
    streakDays,
    favoriteGameSlug,
    favoriteGameName,
  };
}

// The top players of the week, in the order of their rank
export async function fetchLeaderboard(signal: AbortSignal): Promise<readonly LeaderboardEntry[]> {
  const body: unknown = await getJson('/leaderboard', {}, signal);

  return readList(body, toLeaderboardEntry);
}
