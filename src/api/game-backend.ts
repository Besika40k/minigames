import { OWN_GAMES } from '../data/own-games.ts';
import type { OwnGame } from '../types/game.ts';
import type { GameBackend } from '../types/game-backend.ts';
import type {
  CommentLikeState,
  FavoriteState,
  GameCommentsPage,
  GameDetails,
  NewComment,
} from '../types/game-details.ts';
import { fetchGameComments, postComment } from './comments-api.ts';
import { toggleFavorite } from './favorites-api.ts';
import { fetchGameDetails } from './games-api.ts';
import { toggleCommentLike } from './likes-api.ts';
import { findOwnGame } from './own-games.ts';

export type OwnGameStore = typeof import('./own-game-store.ts');

// The store, once it has started to load
const loading: { store?: Promise<OwnGameStore> } = {};

// Firestore comes with the store, so it loads only when a game of MiniGames
// itself needs it. The details and the comments ask for it at the same time,
// and both wait for the one download. A download that fails is tried again on
// the next call.
export async function loadOwnGameStore(): Promise<OwnGameStore> {
  loading.store ??= import('./own-game-store.ts');
  try {
    return await loading.store;
  } catch (error: unknown) {
    loading.store = undefined;
    throw error;
  }
}

// The games of the course API
const API_GAME_BACKEND: GameBackend = {
  fetchDetails: fetchGameDetails,
  toggleFavorite,
  fetchComments: fetchGameComments,
  postComment: async (slug: string, comment: NewComment): Promise<void> => {
    await postComment(slug, comment);
  },
  // The API knows a comment by its id alone
  toggleCommentLike: async (
    _slug: string,
    commentId: string,
    userEmail: string,
  ): Promise<CommentLikeState> => toggleCommentLike(commentId, userEmail),
};

// The games of MiniGames itself, kept in Firestore
const OWN_GAME_BACKEND: GameBackend = {
  fetchDetails: async (
    slug: string,
    signal: AbortSignal,
    userEmail?: string,
  ): Promise<GameDetails> => {
    const { fetchOwnGameDetails } = await loadOwnGameStore();
    return fetchOwnGameDetails(slug, signal, userEmail);
  },
  toggleFavorite: async (slug: string, userEmail: string): Promise<FavoriteState> => {
    const { toggleOwnGameFavorite } = await loadOwnGameStore();
    return toggleOwnGameFavorite(slug, userEmail);
  },
  fetchComments: async (
    slug: string,
    signal: AbortSignal,
    userEmail?: string,
  ): Promise<GameCommentsPage> => {
    const { fetchOwnGameComments } = await loadOwnGameStore();
    return fetchOwnGameComments(slug, signal, userEmail);
  },
  postComment: async (slug: string, comment: NewComment): Promise<void> => {
    const { postOwnGameComment } = await loadOwnGameStore();
    await postOwnGameComment(slug, comment);
  },
  toggleCommentLike: async (
    slug: string,
    commentId: string,
    userEmail: string,
  ): Promise<CommentLikeState> => {
    const { toggleOwnGameCommentLike } = await loadOwnGameStore();
    return toggleOwnGameCommentLike(slug, commentId, userEmail);
  },
};

// The backend of the game with this slug
export function getGameBackend(slug: string): GameBackend {
  return findOwnGame(slug) === undefined ? API_GAME_BACKEND : OWN_GAME_BACKEND;
}

// The games of MiniGames itself with their likes as Firestore counts them. A
// game whose count cannot load keeps the number of its data, so the cards
// still show when Firestore is out of reach.
export async function loadOwnGames(): Promise<readonly OwnGame[]> {
  try {
    const store: OwnGameStore = await loadOwnGameStore();

    return await Promise.all(
      OWN_GAMES.map(async (game: OwnGame): Promise<OwnGame> => ({
        ...game,
        likesCount: await store.countOwnGameLikes(game.slug),
      })),
    );
  } catch {
    return OWN_GAMES;
  }
}
