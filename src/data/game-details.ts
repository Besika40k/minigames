import type { GameDetailsContent } from '../types/game-details.ts';

// The API's limit for the text of a comment, counted after trimming
export const COMMENT_MAX_LENGTH = 500;

// The color tokens a commenter's avatar takes one of, at random (see the
// avatar styles of the comments)
export const AVATAR_COLORS: readonly string[] = [
  'avatar-random-1',
  'avatar-random-2',
  'avatar-random-3',
  'avatar-random-4',
  'avatar-random-5',
];

export const GAME_DETAILS_CONTENT: GameDetailsContent = {
  dialogLabel: 'Game details',
  closeLabel: 'Close',
  ratingLabel: 'Rating',
  likesLabel: 'Likes',
  specLabels: {
    genre: 'Genre',
    players: 'Players',
    duration: 'Duration',
    price: 'Price',
  },
  playLabel: 'Play Now',
  buyLabel: 'Buy Now',
  addFavoriteLabel: 'Add to Favorites',
  removeFavoriteLabel: 'Remove from Favorites',
  favoriteMessages: {
    loginWarning: 'Log in to add games to your favorites.',
    unconfirmed:
      "The change wasn't confirmed, so the game is loaded again to show where it stands.",
    added: 'Added to your favorites.',
    removed: 'Removed from your favorites.',
  },
  recordsTitle: 'Top Records',
  recordsIcon: '🏆',
  medals: ['🥇', '🥈', '🥉'],
  pointsSuffix: 'pts',
  commentsTitle: 'Comments',
  commentLabel: 'Your comment',
  commentPlaceholder: 'Write a comment...',
  commentGuestPlaceholder: 'Log in to write a comment',
  commentMessages: {
    loginWarning: 'Log in to write a comment.',
    unconfirmed:
      "The comment wasn't confirmed. The latest comments are loaded, so check them before sending it again.",
    posted: 'Your comment is posted.',
    tooLong: `A comment can have at most ${String(COMMENT_MAX_LENGTH)} characters.`,
  },
  likeMessages: {
    loginWarning: 'Log in to like comments.',
    unconfirmed:
      "The like wasn't confirmed, so the comments are loaded again to show where they stand.",
  },
  sendLabel: 'Send comment',
  messages: {
    errorTitle: "Couldn't load the game",
    successMessage: 'The game is loaded',
  },
  notFoundTitle: 'Game Not Found',
  notFoundMessageStart: 'There is no game called',
  notFoundMessageEnd: '. It may have been removed, or the link has a typo.',
  commentsMessages: {
    errorTitle: "Couldn't load the comments",
    successMessage: 'The comments are loaded',
  },
  noCommentsTitle: 'No comments yet',
  noCommentsMessage: 'Be the first to share what you think of this game.',
};
