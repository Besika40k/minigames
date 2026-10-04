import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import './empty-state.scss';

export interface EmptyStateOptions {
  readonly title: string;
  readonly message: string;
  // A way on, such as a link to all games
  readonly action?: HTMLElement;
}

// Takes the place of an area whose request worked but found nothing
export function createEmptyState(options: EmptyStateOptions): HTMLElement {
  const action: HTMLElement[] =
    options.action === undefined
      ? []
      : [createElement('div', { className: 'empty-state__action', children: [options.action] })];

  return createElement('div', {
    className: 'empty-state',
    attributes: { role: 'status' },
    children: [
      createIcon(IconName.Search),
      createElement('p', { className: 'empty-state__title', text: options.title }),
      createElement('p', { className: 'empty-state__message', text: options.message }),
      ...action,
    ],
  });
}
