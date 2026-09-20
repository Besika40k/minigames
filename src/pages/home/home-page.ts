import { createHero } from './hero/hero.ts';

export function renderHomePage(): readonly HTMLElement[] {
  return [createHero()];
}
