import { getRouteHref } from '../../../app/router.ts';
import { createButtonLink } from '../../../components/button/button.ts';
import { HERO_CONTENT } from '../../../data/hero.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import { Route } from '../../../types/route.ts';
import { createElement } from '../../../utils/create-element.ts';
import './hero.scss';

const TITLE_ID = 'hero-title';

function createDescription(): HTMLParagraphElement {
  return createElement('p', {
    className: 'hero__description',
    children: [
      createElement('span', {
        className: 'hero__description-text hero__description-text--full',
        text: HERO_CONTENT.description,
      }),
      createElement('span', {
        className: 'hero__description-text hero__description-text--short',
        text: HERO_CONTENT.shortDescription,
      }),
    ],
  });
}

export function createHero(): HTMLElement {
  const title: HTMLHeadingElement = createElement('h1', {
    className: 'hero__title',
    text: HERO_CONTENT.title,
    attributes: { id: TITLE_ID },
  });

  // The button opens the Library page, so it is a link that looks like a button
  const button: HTMLAnchorElement = createButtonLink({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Large,
    text: HERO_CONTENT.buttonText,
    href: getRouteHref(Route.Library),
    className: 'hero__button',
  });

  const card: HTMLDivElement = createElement('div', {
    className: 'hero__card',
    children: [title, createDescription(), button],
  });

  return createElement('section', {
    className: 'hero',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [createElement('div', { className: 'hero__inner', children: [card] })],
  });
}
