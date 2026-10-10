import { describe, expect, it, vi } from 'vitest';
import { pickRandom } from './pick-random.ts';

describe('pickRandom', (): void => {
  it('picks the item that the random number falls on', (): void => {
    const items: readonly string[] = ['a', 'b', 'c', 'd'];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickRandom(items)).toBe('a');

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(pickRandom(items)).toBe('c');

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(pickRandom(items)).toBe('d');
  });

  it('has nothing to pick from an empty list', (): void => {
    expect(pickRandom([])).toBeUndefined();
  });
});
