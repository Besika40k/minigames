import { describe, expect, it } from 'vitest';
import { AuthMode } from '../types/auth.ts';
import { DialogParameter, Route } from '../types/route.ts';
import {
  decideDialog,
  fromLegacyHash,
  parseRoute,
  toAppPath,
  toBrowserUrl,
  type DialogDecision,
} from './url.ts';

const BASE: string = '/minigames/';

describe('toAppPath', (): void => {
  it('maps the base itself to the root path, with or without a slash', (): void => {
    expect(toAppPath('/minigames/', BASE)).toBe('/');
    expect(toAppPath('/minigames', BASE)).toBe('/');
  });

  it('removes the base and trailing slashes from a page path', (): void => {
    expect(toAppPath('/minigames/library', BASE)).toBe('/library');
    expect(toAppPath('/minigames/library//', BASE)).toBe('/library');
  });

  it('has no app path for a path outside the base', (): void => {
    expect(toAppPath('/other/library', BASE)).toBeUndefined();
    expect(toAppPath('/minigames-old/library', BASE)).toBeUndefined();
  });

  it('keeps the whole path under the root base of the dev server', (): void => {
    expect(toAppPath('/library', '/')).toBe('/library');
    expect(toAppPath('/', '/')).toBe('/');
  });
});

describe('toBrowserUrl', (): void => {
  it('puts the base in front of the path and appends the query', (): void => {
    const query: URLSearchParams = new URLSearchParams({ page: '2', sort: 'rating' });

    expect(toBrowserUrl('/library', query, BASE)).toBe('/minigames/library?page=2&sort=rating');
  });

  it('leaves out the question mark when the query is empty', (): void => {
    expect(toBrowserUrl('/', new URLSearchParams(), BASE)).toBe('/minigames/');
    expect(toBrowserUrl('/library', new URLSearchParams(), '/')).toBe('/library');
  });

  it('ends with the hash it is given', (): void => {
    expect(toBrowserUrl('/library', new URLSearchParams('page=2'), BASE, '#top')).toBe(
      '/minigames/library?page=2#top',
    );
  });
});

describe('parseRoute', (): void => {
  it('knows both paths of the Home page and the Library page', (): void => {
    expect(parseRoute('/')).toBe(Route.Home);
    expect(parseRoute('/home')).toBe(Route.Home);
    expect(parseRoute('/library')).toBe(Route.Library);
  });

  it('has no page for an unknown path', (): void => {
    expect(parseRoute('/games')).toBeUndefined();
    expect(parseRoute('/library/extra')).toBeUndefined();
  });
});

describe('fromLegacyHash', (): void => {
  it('reads the path from a Story 2 hash link', (): void => {
    expect(fromLegacyHash('#/library')).toBe('/library');
  });

  it('ignores an empty hash and an in-page anchor', (): void => {
    expect(fromLegacyHash('')).toBeUndefined();
    expect(fromLegacyHash('#top')).toBeUndefined();
  });
});

function decide(query: string, isSignedIn: boolean = false): DialogDecision {
  return decideDialog(new URLSearchParams(query), isSignedIn);
}

describe('decideDialog for a guest', (): void => {
  it('opens Game Details for a game slug', (): void => {
    expect(decide('game=tukoni-forest-keepers')).toEqual({
      dialog: { parameter: DialogParameter.Game, slug: 'tukoni-forest-keepers' },
      correctedQuery: undefined,
      isAuthBlocked: false,
    });
  });

  it('opens the auth dialog in a known mode', (): void => {
    expect(decide('auth=register').dialog).toEqual({
      parameter: DialogParameter.Auth,
      mode: AuthMode.Register,
    });
  });

  it('shows the auth dialog over a game and keeps the game in the address', (): void => {
    expect(decide('game=chess&auth=login')).toEqual({
      dialog: { parameter: DialogParameter.Auth, mode: AuthMode.Login },
      correctedQuery: undefined,
      isAuthBlocked: false,
    });
  });

  it('opens nothing without a dialog parameter', (): void => {
    expect(decide('page=2')).toEqual({
      dialog: undefined,
      correctedQuery: undefined,
      isAuthBlocked: false,
    });
  });

  it('removes an unknown auth mode and an empty game, keeping the rest', (): void => {
    const unknownMode: DialogDecision = decide('page=2&auth=admin&game=chess');
    expect(unknownMode.dialog).toEqual({ parameter: DialogParameter.Game, slug: 'chess' });
    expect(unknownMode.correctedQuery?.toString()).toBe('page=2&game=chess');

    expect(decide('game=&sort=name-asc').correctedQuery?.toString()).toBe('sort=name-asc');
  });

  it('leaves the given query unchanged', (): void => {
    const query: URLSearchParams = new URLSearchParams('auth=admin');

    decideDialog(query, false);

    expect(query.toString()).toBe('auth=admin');
  });
});

describe('decideDialog for a signed-in user', (): void => {
  it('keeps the auth dialog closed and takes it out of the address', (): void => {
    expect(decide('auth=login&page=2', true)).toEqual({
      dialog: undefined,
      correctedQuery: new URLSearchParams('page=2'),
      isAuthBlocked: true,
    });
  });

  it('shows the game that the auth dialog was asked over', (): void => {
    const decision: DialogDecision = decide('game=chess&auth=register', true);

    expect(decision.dialog).toEqual({ parameter: DialogParameter.Game, slug: 'chess' });
    expect(decision.correctedQuery?.toString()).toBe('game=chess');
    expect(decision.isAuthBlocked).toBe(true);
  });

  it('removes an unknown auth mode without calling it blocked', (): void => {
    expect(decide('auth=admin', true)).toEqual({
      dialog: undefined,
      correctedQuery: new URLSearchParams(),
      isAuthBlocked: false,
    });
  });

  it('opens Game Details as for a guest', (): void => {
    expect(decide('game=chess', true).dialog).toEqual({
      parameter: DialogParameter.Game,
      slug: 'chess',
    });
  });
});
