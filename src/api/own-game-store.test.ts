import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  deleteDoc,
  getCount,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore/lite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRESTORE_ERROR_MESSAGES } from '../data/firestore.ts';
import { ApiError, ApiErrorKind } from './api-error.ts';
import {
  countOwnGameLikes,
  fetchOwnGameComments,
  fetchOwnGameDetails,
  listOwnGameFavorites,
  listOwnGameRecords,
  postOwnGameComment,
  toggleOwnGameCommentLike,
  toggleOwnGameFavorite,
} from './own-game-store.ts';

// Firestore without a server: a reference is its path, and the tests answer
// the reads of each path
vi.mock('firebase/firestore/lite', () => {
  interface FakeReference {
    readonly path: string;
  }
  const join = (parent: unknown, segments: readonly string[]): FakeReference => {
    const base: string =
      typeof parent === 'object' && parent !== null && 'path' in parent ? String(parent.path) : '';
    return { path: [base, ...segments].filter((part: string): boolean => part !== '').join('/') };
  };

  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn((parent: unknown, ...segments: string[]) => join(parent, segments)),
    doc: vi.fn((parent: unknown, ...segments: string[]) => join(parent, segments)),
    query: vi.fn((reference: FakeReference) => reference),
    orderBy: vi.fn(),
    limit: vi.fn(),
    where: vi.fn(),
    getCount: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-time'),
    Timestamp: class {
      private readonly seconds: number;

      public constructor(seconds: number) {
        this.seconds = seconds;
      }

      public toDate(): Date {
        return new Date(this.seconds * 1000);
      }
    },
  };
});
vi.mock('./firebase-app.ts', () => ({ getFirebaseApp: vi.fn() }));
vi.mock('../auth/firebase.ts', () => ({ getFirebaseAuth: vi.fn(() => auth) }));

// The signed-in user of Firebase, or none
const auth: { currentUser: { uid: string } | undefined; authStateReady: () => Promise<void> } = {
  currentUser: undefined,
  authStateReady: vi.fn((): Promise<void> => Promise.resolve()),
};

const SLUG = 'alchemists-cauldron';
const EMAIL = 'alex@minigames.com';
const USER_ID = 'user-1';

function pathOf(reference: unknown): string {
  return (reference as { path: string }).path;
}

// Firestore counts these documents in each collection
function answerCounts(counts: Readonly<Record<string, number>>): void {
  vi.mocked(getCount).mockImplementation((reference: unknown) => {
    const count: number = counts[pathOf(reference)] ?? 0;
    return Promise.resolve({ data: () => ({ count }) } as Awaited<ReturnType<typeof getCount>>);
  });
}

// These documents exist; any other does not
function answerDocuments(paths: readonly string[]): void {
  vi.mocked(getDoc).mockImplementation((reference: unknown) => {
    const isExisting: boolean = paths.includes(pathOf(reference));
    return Promise.resolve({ exists: () => isExisting } as Awaited<ReturnType<typeof getDoc>>);
  });
}

function createRecordDocument(data: unknown): unknown {
  return { data: () => data };
}

// The records Firestore gives for every query of records
function answerRecords(records: readonly unknown[]): void {
  vi.mocked(getDocs).mockResolvedValue({
    docs: records.map((data: unknown): unknown => createRecordDocument(data)),
  } as Awaited<ReturnType<typeof getDocs>>);
}

function createCommentDocument(id: string, data: unknown): unknown {
  return { id, ref: { path: `games/${SLUG}/comments/${id}` }, data: () => data };
}

const SIGNAL: AbortSignal = new AbortController().signal;

// 28.10.2026, 10:00 UTC, in the seconds of a Firestore timestamp
const CREATED_AT: Timestamp = new Timestamp(Date.UTC(2026, 9, 28, 10) / 1000, 0);

beforeEach((): void => {
  vi.clearAllMocks();
  // Each test starts with writes that succeed
  vi.mocked(setDoc).mockResolvedValue();
  vi.mocked(deleteDoc).mockResolvedValue();
  auth.currentUser = { uid: USER_ID };
  answerCounts({});
  answerDocuments([]);
  answerRecords([]);
});

describe('countOwnGameLikes', (): void => {
  it('counts the users who have the game among their favorites', async (): Promise<void> => {
    answerCounts({ [`games/${SLUG}/favorites`]: 4 });

    await expect(countOwnGameLikes(SLUG)).resolves.toBe(4);
  });
});

describe('fetchOwnGameDetails', (): void => {
  it('gives a guest the counted likes and no favorite, without asking for a user', async (): Promise<void> => {
    answerCounts({ [`games/${SLUG}/favorites`]: 5 });

    const details = await fetchOwnGameDetails(SLUG, SIGNAL);

    expect(details).toMatchObject({ slug: SLUG, likesCount: 5, isLikedByCurrentUser: false });
    expect(getDoc).not.toHaveBeenCalled();
  });

  it("says whether the game is among the signed-in user's favorites", async (): Promise<void> => {
    answerDocuments([`games/${SLUG}/favorites/${USER_ID}`]);

    const details = await fetchOwnGameDetails(SLUG, SIGNAL, EMAIL);

    expect(details.isLikedByCurrentUser).toBe(true);
  });

  it('gives the best records with their places and difficulties', async (): Promise<void> => {
    answerRecords([
      { userId: 'u2', playerName: 'Mira', score: 2400, difficulty: 'hard', achievedAt: CREATED_AT },
      {
        userId: USER_ID,
        playerName: 'Alex',
        score: 900,
        difficulty: 'easy',
        achievedAt: CREATED_AT,
      },
    ]);

    const details = await fetchOwnGameDetails(SLUG, SIGNAL);

    expect(details.topRecords).toEqual([
      {
        position: 1,
        playerName: 'Mira',
        score: 2400,
        detail: 'Hard',
        achievedAt: '2026-10-28T10:00:00.000Z',
      },
      {
        position: 2,
        playerName: 'Alex',
        score: 900,
        detail: 'Easy',
        achievedAt: '2026-10-28T10:00:00.000Z',
      },
    ]);
  });

  it('fails on a record without a score', async (): Promise<void> => {
    answerRecords([{ playerName: 'Mira', difficulty: 'hard', achievedAt: CREATED_AT }]);

    await expect(fetchOwnGameDetails(SLUG, SIGNAL)).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });

  it('fails as not found for a game that is not one of MiniGames itself', async (): Promise<void> => {
    await expect(fetchOwnGameDetails('palia', SIGNAL)).rejects.toMatchObject({
      kind: ApiErrorKind.NotFound,
    });
  });
});

describe('toggleOwnGameFavorite', (): void => {
  it("adds the user's favorite with the server's time and counts again", async (): Promise<void> => {
    answerCounts({ [`games/${SLUG}/favorites`]: 1 });

    await expect(toggleOwnGameFavorite(SLUG, EMAIL)).resolves.toEqual({
      isFavorited: true,
      likesCount: 1,
    });
    expect(setDoc).toHaveBeenCalledExactlyOnceWith(
      { path: `games/${SLUG}/favorites/${USER_ID}` },
      { createdAt: 'server-time' },
    );
  });

  it('removes a favorite that is there', async (): Promise<void> => {
    answerDocuments([`games/${SLUG}/favorites/${USER_ID}`]);

    await expect(toggleOwnGameFavorite(SLUG, EMAIL)).resolves.toEqual({
      isFavorited: false,
      likesCount: 0,
    });
    expect(deleteDoc).toHaveBeenCalledExactlyOnceWith({
      path: `games/${SLUG}/favorites/${USER_ID}`,
    });
  });

  it('refuses a change when Firebase has no signed-in user', async (): Promise<void> => {
    auth.currentUser = undefined;

    await expect(toggleOwnGameFavorite(SLUG, EMAIL)).rejects.toEqual(
      new ApiError(ApiErrorKind.Unauthorized, FIRESTORE_ERROR_MESSAGES.signedOut),
    );
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('turns a refusal of the rules into an error that says nothing changed', async (): Promise<void> => {
    vi.mocked(setDoc).mockRejectedValue(new FirebaseError('permission-denied', 'denied'));

    await expect(toggleOwnGameFavorite(SLUG, EMAIL)).rejects.toEqual(
      new ApiError(ApiErrorKind.Unauthorized, FIRESTORE_ERROR_MESSAGES.refused),
    );
  });

  it('turns a lost connection into an error whose outcome is unknown', async (): Promise<void> => {
    vi.mocked(setDoc).mockRejectedValue(new FirebaseError('unavailable', 'offline'));

    await expect(toggleOwnGameFavorite(SLUG, EMAIL)).rejects.toMatchObject({
      kind: ApiErrorKind.Network,
    });
  });
});

describe('fetchOwnGameComments', (): void => {
  it('gives the newest comments with their likes and the total', async (): Promise<void> => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createCommentDocument('c1', {
          authorName: 'Alex Pro',
          text: 'Lovely',
          createdAt: CREATED_AT,
        }),
      ],
    } as Awaited<ReturnType<typeof getDocs>>);
    answerCounts({ [`games/${SLUG}/comments`]: 7, [`games/${SLUG}/comments/c1/likes`]: 2 });
    answerDocuments([`games/${SLUG}/comments/c1/likes/${USER_ID}`]);

    await expect(fetchOwnGameComments(SLUG, SIGNAL, EMAIL)).resolves.toEqual({
      comments: [
        {
          commentId: 'c1',
          authorName: 'Alex Pro',
          text: 'Lovely',
          likesCount: 2,
          isLikedByCurrentUser: true,
          createdAt: '2026-10-28T10:00:00.000Z',
        },
      ],
      totalComments: 7,
    });
  });

  it('fails on a document without the fields of a comment', async (): Promise<void> => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [createCommentDocument('c1', { text: 'No author' })],
    } as Awaited<ReturnType<typeof getDocs>>);

    await expect(fetchOwnGameComments(SLUG, SIGNAL)).rejects.toMatchObject({
      kind: ApiErrorKind.InvalidResponse,
    });
  });
});

describe('postOwnGameComment', (): void => {
  it("adds the comment with the user's id and the server's time", async (): Promise<void> => {
    await postOwnGameComment(SLUG, { userEmail: EMAIL, authorName: 'Alex Pro', text: 'Fun' });

    expect(addDoc).toHaveBeenCalledExactlyOnceWith(
      { path: `games/${SLUG}/comments` },
      { authorId: USER_ID, authorName: 'Alex Pro', text: 'Fun', createdAt: 'server-time' },
    );
  });
});

describe('toggleOwnGameCommentLike', (): void => {
  it("adds the user's like to the comment and counts its likes", async (): Promise<void> => {
    answerCounts({ [`games/${SLUG}/comments/c1/likes`]: 3 });

    await expect(toggleOwnGameCommentLike(SLUG, 'c1', EMAIL)).resolves.toEqual({
      isLikedByCurrentUser: true,
      likesCount: 3,
    });
    expect(setDoc).toHaveBeenCalledExactlyOnceWith(
      { path: `games/${SLUG}/comments/c1/likes/${USER_ID}` },
      { createdAt: 'server-time' },
    );
  });
});

describe('listOwnGameFavorites', (): void => {
  it("names the own games among the user's favorites", async (): Promise<void> => {
    answerDocuments([`games/${SLUG}/favorites/${USER_ID}`]);

    await expect(listOwnGameFavorites(EMAIL)).resolves.toEqual([SLUG]);
  });

  it('names none when the user has no favorite', async (): Promise<void> => {
    await expect(listOwnGameFavorites(EMAIL)).resolves.toEqual([]);
  });
});

describe('listOwnGameRecords', (): void => {
  it("gives the user's records in the own games, the best first", async (): Promise<void> => {
    answerRecords([
      {
        userId: USER_ID,
        playerName: 'Alex',
        score: 600,
        difficulty: 'easy',
        achievedAt: CREATED_AT,
      },
      {
        userId: USER_ID,
        playerName: 'Alex',
        score: 1500,
        difficulty: 'hard',
        achievedAt: CREATED_AT,
      },
    ]);

    await expect(listOwnGameRecords(EMAIL)).resolves.toEqual([
      {
        gameSlug: SLUG,
        gameName: "Alchemist's Cauldron",
        playerName: 'Alex',
        score: 1500,
        detail: 'Hard',
        achievedAt: '2026-10-28T10:00:00.000Z',
      },
      {
        gameSlug: SLUG,
        gameName: "Alchemist's Cauldron",
        playerName: 'Alex',
        score: 600,
        detail: 'Easy',
        achievedAt: '2026-10-28T10:00:00.000Z',
      },
    ]);
  });

  it('refuses a guest', async (): Promise<void> => {
    auth.currentUser = undefined;

    await expect(listOwnGameRecords(EMAIL)).rejects.toBeInstanceOf(ApiError);
  });
});
