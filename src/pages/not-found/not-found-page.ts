import { getRouteHref } from '../../app/router.ts';
import { Route } from '../../types/route.ts';
import { createElement } from '../../utils/create-element.ts';

export function renderNotFoundPage(): readonly HTMLElement[] {
  return [
    createElement('section', {
      children: [
        createElement('h1', { text: 'Page not found' }),
        createElement('a', {
          text: 'Back to home',
          attributes: { href: getRouteHref(Route.Home) },
        }),
      ],
    }),
  ];
}
