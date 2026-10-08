import { describe, expect, it } from 'vitest';
import { AuthMode } from '../types/auth.ts';
import { DialogParameter, Route } from '../types/route.ts';
import {
  fromLegacyHash,
  parseDialog,
  parseRoute,
  removeUnusedDialogParameters,
  toAppPath,
  toBrowserUrl,
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

describe('parseDialog', (): void => {
  it('opens Game Details for a game slug', (): void => {
    expect(parseDialog(new URLSearchParams('game=tukoni-forest-keepers'))).toEqual({
      parameter: DialogParameter.Game,
      slug: 'tukoni-forest-keepers',
    });
  });

  it('opens the auth dialog in a known mode', (): void => {
    expect(parseDialog(new URLSearchParams('auth=register'))).toEqual({
      parameter: DialogParameter.Auth,
      mode: AuthMode.Register,
    });
  });

  it('prefers the game when both dialogs are asked for', (): void => {
    expect(parseDialog(new URLSearchParams('auth=login&game=chess'))).toEqual({
      parameter: DialogParameter.Game,
      slug: 'chess',
    });
  });

  it('opens nothing for an unknown auth mode, an empty game or no dialog', (): void => {
    expect(parseDialog(new URLSearchParams('auth=admin'))).toBeUndefined();
    expect(parseDialog(new URLSearchParams('game='))).toBeUndefined();
    expect(parseDialog(new URLSearchParams('page=2'))).toBeUndefined();
  });
});

describe('removeUnusedDialogParameters', (): void => {
  it('needs no change when every dialog parameter is in use', (): void => {
    const query: URLSearchParams = new URLSearchParams('page=2&auth=login');

    expect(removeUnusedDialogParameters(query, parseDialog(query))).toBeUndefined();
  });

  it('removes an unknown auth mode and keeps the other parameters', (): void => {
    const query: URLSearchParams = new URLSearchParams('page=2&auth=admin');

    expect(removeUnusedDialogParameters(query, parseDialog(query))?.toString()).toBe('page=2');
  });

  it('removes the auth mode next to a game without changing the given query', (): void => {
    const query: URLSearchParams = new URLSearchParams('game=chess&auth=login');

    expect(removeUnusedDialogParameters(query, parseDialog(query))?.toString()).toBe('game=chess');
    expect(query.toString()).toBe('game=chess&auth=login');
  });
});
