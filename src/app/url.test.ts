import { describe, expect, it } from 'vitest';
import { Route } from '../types/route.ts';
import { fromLegacyHash, parseRoute, toAppPath, toBrowserUrl } from './url.ts';

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
