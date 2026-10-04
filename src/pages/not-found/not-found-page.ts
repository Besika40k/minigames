import { getRouteHref } from '../../app/router.ts';
import { createButtonLink } from '../../components/button/button.ts';
import { NOT_FOUND_CONTENT } from '../../data/not-found.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { Route } from '../../types/route.ts';
import { createElement } from '../../utils/create-element.ts';
import './not-found-page.scss';

const TITLE_ID = 'not-found-title';

// The address as it was typed, with escaped letters spelled out. A broken
// escape stays as it is instead of stopping the page.
function decodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

// The page for an address that no page has. The header and the footer stay,
// and the main part says what went wrong and leads back to Home.
export function renderNotFoundPage(): readonly HTMLElement[] {
  const message: HTMLParagraphElement = createElement('p', {
    className: 'not-found__message',
    children: [
      `${NOT_FOUND_CONTENT.messageStart} `,
      createElement('code', {
        className: 'not-found__path',
        text: decodePath(globalThis.location.pathname),
      }),
      NOT_FOUND_CONTENT.messageEnd,
    ],
  });

  const homeLink: HTMLAnchorElement = createButtonLink({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Large,
    text: NOT_FOUND_CONTENT.homeLinkText,
    href: getRouteHref(Route.Home),
    className: 'not-found__home',
  });

  const inner: HTMLDivElement = createElement('div', {
    className: 'not-found__inner',
    children: [
      createElement('p', {
        className: 'not-found__code',
        text: NOT_FOUND_CONTENT.code,
        attributes: { 'aria-hidden': 'true' },
      }),
      createElement('h1', {
        className: 'not-found__title',
        text: NOT_FOUND_CONTENT.title,
        attributes: { id: TITLE_ID },
      }),
      message,
      homeLink,
    ],
  });

  return [
    createElement('section', {
      className: 'not-found',
      attributes: { 'aria-labelledby': TITLE_ID },
      children: [inner],
    }),
  ];
}
