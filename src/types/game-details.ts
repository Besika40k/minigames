import type { LoadMessages } from './feedback.ts';

// The facts shown in the four boxes under the description
export interface GameSpecs {
  readonly genre: string;
  readonly players: string;
  readonly duration: string;
  readonly price: string;
}

export interface TopRecord {
  readonly position: number;
  readonly playerName: string;
  readonly score: number;
  // An ISO date, such as "2026-08-28T14:30:00Z"
  readonly achievedAt: string;
}

// A comment on a game, with the field names of the API
// (`GET /api/games/{slug}/comments`)
export interface GameComment {
  readonly commentId: string;
  readonly authorName: string;
  readonly text: string;
  // Includes the current user's like when they liked the comment
  readonly likesCount: number;
  readonly isLikedByCurrentUser: boolean;
  // An ISO date, such as "2026-08-30T07:00:00Z"
  readonly createdAt: string;
}

// The latest comments of a game, and how many the game has in all
export interface GameCommentsPage {
  readonly comments: readonly GameComment[];
  readonly totalComments: number;
}

// The details of a game, with the field names of the API
// (`GET /api/games/{slug}`). The hero image is the address the browser loads it
// from.
export interface GameDetails {
  readonly slug: string;
  readonly name: string;
  readonly heroImage: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly fullDescription: string;
  readonly specs: GameSpecs;
  readonly topRecords: readonly TopRecord[];
}

export interface GameDetailsContent {
  // The name of the dialog while it has no game title to show
  readonly dialogLabel: string;
  readonly closeLabel: string;
  // Read out before the numbers, which show only an icon on the screen
  readonly ratingLabel: string;
  readonly likesLabel: string;
  readonly specLabels: Readonly<Record<keyof GameSpecs, string>>;
  readonly playLabel: string;
  // A game that is not free is bought instead: "Buy Now: $1.99"
  readonly buyLabel: string;
  // The Favorites button says what a click will do
  readonly addFavoriteLabel: string;
  readonly removeFavoriteLabel: string;
  readonly recordsTitle: string;
  readonly recordsIcon: string;
  // The medals of the first, second and third places
  readonly medals: readonly string[];
  readonly pointsSuffix: string;
  readonly commentsTitle: string;
  // The initial shown in the comment form's avatar until users can sign in
  readonly currentUserInitial: string;
  readonly commentLabel: string;
  readonly commentPlaceholder: string;
  readonly sendLabel: string;
  readonly messages: LoadMessages;
  // The state of an address whose game does not exist: the sentence around
  // the slug it names
  readonly notFoundTitle: string;
  readonly notFoundMessageStart: string;
  readonly notFoundMessageEnd: string;
}

// A part of the dialog. `reset` puts it back the way it looks when the dialog
// opens, because nothing the visitor changes inside is kept at this stage.
export interface GameDetailsSection {
  readonly element: HTMLElement;
  readonly reset: () => void;
}

export interface GameDetailsDialog {
  readonly element: HTMLDialogElement;
  // Opens the dialog and loads the game of a slug. The game that is already
  // open stays as it is.
  readonly show: (slug: string) => void;
  // Closes the dialog and cancels its request
  readonly hide: () => void;
}
