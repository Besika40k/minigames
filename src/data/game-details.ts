import type { GameComment, GameDetailsContent } from '../types/game-details.ts';

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
  recordsTitle: 'Top Records',
  recordsIcon: '🏆',
  medals: ['🥇', '🥈', '🥉'],
  pointsSuffix: 'pts',
  commentsTitle: 'Comments',
  currentUserInitial: 'U',
  commentLabel: 'Your comment',
  commentPlaceholder: 'Write a comment...',
  sendLabel: 'Send comment',
  messages: {
    errorTitle: "Couldn't load the game",
    successMessage: 'The game is loaded',
  },
  notFoundTitle: 'Game Not Found',
  notFoundMessageStart: 'There is no game called',
  notFoundMessageEnd: '. It may have been removed, or the link has a typo.',
};

// The comments of the course's mock data (`comments-tukoni-forest-keepers.json`),
// shown under every game until the comments come from the API. The mockup
// shows the last one liked by the current user, so it starts liked here too.
export const STATIC_COMMENTS: readonly GameComment[] = [
  {
    commentId: 'c5d9f2a1-7c3b-4e8f-9a0d-000000000001',
    authorName: 'ForestDweller',
    text: "The hand-drawn art is absolutely magical 🍄 Every location feels like a page from a children's storybook. The mushroom village made me cry happy tears!",
    likesCount: 12,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-30T07:00:00Z',
  },
  {
    commentId: 'c5d9f2a1-7c3b-4e8f-9a0d-000000000002',
    authorName: 'HerbalTeaLover',
    text: 'Perfect cozy evening game — brew a cup of chamomile, wrap in a blanket and help the little Tukoni prepare for winter. The puzzles are gentle but satisfying.',
    likesCount: 5,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-29T15:30:00Z',
  },
  {
    commentId: 'c5d9f2a1-7c3b-4e8f-9a0d-000000000003',
    authorName: 'CottageCoreMia',
    text: 'I want to live inside this game forever 🌿 The NPCs are so charming, the tea recipes are real, and the atmosphere is pure warmth and calm.',
    likesCount: 8,
    isLikedByCurrentUser: true,
    createdAt: '2026-08-27T20:10:00Z',
  },
];
