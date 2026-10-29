import type {
  CommentLikeState,
  FavoriteState,
  GameCommentsPage,
  GameDetails,
  NewComment,
} from './game-details.ts';

// Where the details, favorites and comments of a game live: the course API
// for its own games, Firestore for the games of MiniGames itself. The dialog
// asks the backend of the game it shows, so it works the same way for both.
// Every failure is an ApiError, except a cancel by the caller.
export interface GameBackend {
  // With the email of a signed-in user the game also says whether it is among
  // that user's favorites. An unknown slug fails with a NotFound error.
  readonly fetchDetails: (
    slug: string,
    signal: AbortSignal,
    userEmail?: string,
  ) => Promise<GameDetails>;
  // Adds the game to the user's favorites, or removes it when it is there
  readonly toggleFavorite: (slug: string, userEmail: string) => Promise<FavoriteState>;
  // The latest comments and how many there are in all. With the email of a
  // signed-in user each comment says whether that user liked it.
  readonly fetchComments: (
    slug: string,
    signal: AbortSignal,
    userEmail?: string,
  ) => Promise<GameCommentsPage>;
  readonly postComment: (slug: string, comment: NewComment) => Promise<void>;
  // Likes a comment for the user, or takes the like back when it is there
  readonly toggleCommentLike: (
    slug: string,
    commentId: string,
    userEmail: string,
  ) => Promise<CommentLikeState>;
}

// The texts of the failures of Firestore, by the kind of ApiError they become
export interface OwnGameErrorMessages {
  readonly signedOut: string;
  readonly refused: string;
  readonly rateLimit: string;
  readonly notFound: string;
  readonly network: string;
  readonly failed: string;
  readonly invalidData: string;
}
