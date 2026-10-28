import { describe, expect, it } from 'vitest';
import { OWN_GAMES } from '../data/own-games.ts';
import type { OwnGame } from '../types/game.ts';
import type { GameDetails } from '../types/game-details.ts';
import { findOwnGame, getOwnGameDetails } from './own-games.ts';

describe('findOwnGame', (): void => {
  it('finds a game of MiniGames itself by its slug', (): void => {
    expect(findOwnGame('alchemists-cauldron')?.name).toBe("Alchemist's Cauldron");
  });

  it('knows nothing of the games of the API', (): void => {
    expect(findOwnGame('palia')).toBeUndefined();
  });
});

describe('getOwnGameDetails', (): void => {
  it('gives the details in the shape of the API, with the site to play on', (): void => {
    const [game] = OWN_GAMES as [OwnGame];
    const details: GameDetails = getOwnGameDetails(game);

    expect(details).toEqual({
      slug: game.slug,
      name: game.name,
      heroImage: game.heroImage,
      rating: game.rating,
      likesCount: game.likesCount,
      isLikedByCurrentUser: false,
      fullDescription: game.fullDescription,
      specs: game.specs,
      topRecords: [],
      playUrl: 'https://besika40k.github.io/alchemists-cauldron/',
    });
  });
});
