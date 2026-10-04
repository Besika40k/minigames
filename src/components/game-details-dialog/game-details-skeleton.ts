import { createElement } from '../../utils/create-element.ts';
import { createSkeleton } from '../skeleton/skeleton.ts';

// A game has four spec boxes and three top records
const SPEC_COUNT = 4;
const RECORD_COUNT = 3;

function createBlocks(count: number, className: string): HTMLSpanElement[] {
  return Array.from({ length: count }, (): HTMLSpanElement => createSkeleton(className));
}

// The dialog while its game loads: grey blocks in the places of the hero, the
// title, the description, the specs, the buttons and the records
export function createGameDetailsSkeleton(): readonly Node[] {
  const specs: HTMLDivElement = createElement('div', {
    className: 'game-details__specs',
    children: createBlocks(SPEC_COUNT, 'game-details__skeleton-spec'),
  });
  const records: HTMLDivElement = createElement('div', {
    className: 'game-details__records',
    children: [
      createSkeleton('game-details__skeleton-line game-details__skeleton-line--subtitle'),
      createElement('div', {
        className: 'game-details__records-list',
        children: createBlocks(RECORD_COUNT, 'game-details__skeleton-record'),
      }),
    ],
  });
  const content: HTMLDivElement = createElement('div', {
    className: 'game-details__content game-details__content--top',
    children: [
      createSkeleton('game-details__skeleton-line game-details__skeleton-line--title'),
      ...createBlocks(2, 'game-details__skeleton-line'),
      createSkeleton('game-details__skeleton-line game-details__skeleton-line--short'),
      specs,
      createSkeleton('game-details__skeleton-actions'),
      records,
    ],
  });

  return [createSkeleton('game-details__hero game-details__skeleton-hero'), content];
}
