import { createElement } from '../../utils/create-element.ts';

export function renderHomePage(): readonly HTMLElement[] {
  return [createElement('h1', { text: 'MiniGames' })];
}
