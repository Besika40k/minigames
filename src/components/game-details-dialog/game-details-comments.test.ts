import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { fetchGameComments } from '../../api/comments-api.ts';
import { GAME_DETAILS_CONTENT } from '../../data/game-details.ts';
import type { GameComment, GameCommentsSection } from '../../types/game-details.ts';
import type { AppSession } from '../../types/session.ts';
import { createGameDetailsComments } from './game-details-comments.ts';

vi.mock('../../api/comments-api.ts', () => ({ fetchGameComments: vi.fn(), postComment: vi.fn() }));
vi.mock('../snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

const SESSION: AppSession = {
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: Date.UTC(2026, 9, 10),
};

function createComment(commentId: string, authorName: string): GameComment {
  return {
    commentId,
    authorName,
    text: 'Lovely',
    likesCount: 1,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-30T07:00:00Z',
  };
}

function renderComments(session: AppSession | undefined): GameCommentsSection {
  const getSession: Mock<() => AppSession | undefined> = vi
    .fn<() => AppSession | undefined>()
    .mockReturnValue(session);
  const comments: GameCommentsSection = createGameDetailsComments({
    getSession,
    requireSession: vi.fn<(warning: string) => AppSession | undefined>(),
  });
  document.body.append(comments.element);

  return comments;
}

// The avatars of the shown comments: the letter and the color class
function getAvatars(comments: GameCommentsSection): string[] {
  return [...comments.element.querySelectorAll(':scope .game-details__avatar')].map(
    (avatar: Element): string => `${avatar.textContent} ${avatar.className}`,
  );
}

// Lets the answer of the mocked request arrive
async function settle(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
});

afterEach((): void => {
  document.body.replaceChildren();
});

describe('game details comments', (): void => {
  it('loads the likes of the signed-in user and counts every comment', async (): Promise<void> => {
    vi.mocked(fetchGameComments).mockResolvedValue({
      comments: [createComment('c1', 'ForestDweller')],
      totalComments: 8,
    });
    const comments: GameCommentsSection = renderComments(SESSION);

    comments.show('chess');
    await settle();

    expect(fetchGameComments).toHaveBeenCalledExactlyOnceWith(
      'chess',
      expect.any(AbortSignal),
      'alex@minigames.com',
    );
    expect(comments.element.querySelector('h3')?.textContent).toBe(
      `${GAME_DETAILS_CONTENT.commentsTitle} (8)`,
    );
  });

  it('asks for the comments of a guest without naming a user', async (): Promise<void> => {
    vi.mocked(fetchGameComments).mockResolvedValue({ comments: [], totalComments: 0 });
    const comments: GameCommentsSection = renderComments(undefined);

    comments.show('chess');
    await settle();

    expect(fetchGameComments).toHaveBeenCalledWith('chess', expect.any(AbortSignal), undefined);
    expect(comments.element.textContent).toContain(GAME_DETAILS_CONTENT.noCommentsTitle);
  });

  it('gives each commenter a random avatar color that stays when the comments load again', async (): Promise<void> => {
    vi.mocked(fetchGameComments).mockResolvedValue({
      comments: [createComment('c1', '  forestDweller'), createComment('c2', 'élodie')],
      totalComments: 2,
    });
    const random: Mock<() => number> = vi.spyOn(Math, 'random');
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.99);
    const comments: GameCommentsSection = renderComments(SESSION);

    comments.show('chess');
    await settle();

    expect(getAvatars(comments)).toEqual([
      'F game-details__avatar game-details__avatar--avatar-random-1',
      'É game-details__avatar game-details__avatar--avatar-random-5',
    ]);

    // Another draw would pick other colors, but the commenters keep theirs
    random.mockReturnValue(0.5);
    vi.mocked(fetchGameComments).mockResolvedValue({
      comments: [
        createComment('c3', 'NewPlayer'),
        createComment('c1', 'forestDweller'),
        createComment('c2', 'élodie'),
      ],
      totalComments: 3,
    });
    comments.show('chess');
    await settle();

    expect(getAvatars(comments)).toEqual([
      'N game-details__avatar game-details__avatar--avatar-random-3',
      'F game-details__avatar game-details__avatar--avatar-random-1',
      'É game-details__avatar game-details__avatar--avatar-random-5',
    ]);
  });
});
