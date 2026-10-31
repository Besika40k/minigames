import { OWN_GAMES } from '../data/own-games.ts';
import type { Game, OwnGame } from '../types/game.ts';
import type { GameDetails } from '../types/game-details.ts';
import type { UserProfile, UserRecord } from '../types/profile.ts';
import { loadOwnGameStore, type OwnGameStore } from './game-backend.ts';
import { fetchAllGames, fetchGameDetails } from './games-api.ts';

type ProfileStore = typeof import('./profile-store.ts');

// The store, once it has started to load
const loading: { store?: Promise<ProfileStore> } = {};

// Firestore comes with the store, so it loads only when a profile needs it.
// A download that fails is tried again on the next call.
async function loadProfileStore(): Promise<ProfileStore> {
  loading.store ??= import('./profile-store.ts');
  try {
    return await loading.store;
  } catch (error: unknown) {
    loading.store = undefined;
    throw error;
  }
}

// The bio and the picture of the signed-in user
export async function fetchUserProfile(userEmail: string): Promise<UserProfile> {
  const store: ProfileStore = await loadProfileStore();

  return store.fetchUserProfile(userEmail);
}

export async function saveUserProfile(userEmail: string, profile: UserProfile): Promise<void> {
  const store: ProfileStore = await loadProfileStore();
  await store.saveUserProfile(userEmail, profile);
}

// The games of the API the user has among their favorites. The API has no
// list of a user's favorites: each game's details say whether it is one, so
// every game is asked for, all at the same time.
async function fetchApiFavorites(userEmail: string, signal: AbortSignal): Promise<readonly Game[]> {
  const games: readonly Game[] = await fetchAllGames(signal);
  const details: readonly GameDetails[] = await Promise.all(
    games.map((game: Game): Promise<GameDetails> => fetchGameDetails(game.slug, signal, userEmail)),
  );
  const favorites: ReadonlySet<string> = new Set(
    details
      .filter((game: GameDetails): boolean => game.isLikedByCurrentUser)
      .map((game: GameDetails): string => game.slug),
  );

  return games.filter((game: Game): boolean => favorites.has(game.slug));
}

async function fetchOwnFavorites(userEmail: string): Promise<readonly OwnGame[]> {
  const store: OwnGameStore = await loadOwnGameStore();
  const slugs: readonly string[] = await store.listOwnGameFavorites(userEmail);

  return OWN_GAMES.filter((game: OwnGame): boolean => slugs.includes(game.slug));
}

// Every game the user has among their favorites: the games of MiniGames
// itself first, then the API's in the order of their names
export async function fetchFavoriteGames(
  userEmail: string,
  signal: AbortSignal,
): Promise<readonly Game[]> {
  const [ownGames, apiGames] = await Promise.all([
    fetchOwnFavorites(userEmail),
    fetchApiFavorites(userEmail, signal),
  ]);

  return [...ownGames, ...apiGames];
}

// The best scores of the user in the games of MiniGames itself
export async function fetchUserRecords(userEmail: string): Promise<readonly UserRecord[]> {
  const store: OwnGameStore = await loadOwnGameStore();

  return store.listOwnGameRecords(userEmail);
}
