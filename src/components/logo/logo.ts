import { getRouteHref } from '../../app/router.ts';
import logoImageUrl from '../../assets/images/logo.png';
import { Route } from '../../types/route.ts';
import { createElement } from '../../utils/create-element.ts';
import './logo.scss';

export interface LogoOptions {
  readonly className?: string;
}

export function createLogo(options: LogoOptions = {}): HTMLAnchorElement {
  const image: HTMLImageElement = createElement('img', {
    className: 'logo__image',
    attributes: { src: logoImageUrl, alt: '', width: '28', height: '28' },
  });

  const tile: HTMLSpanElement = createElement('span', {
    className: 'logo__tile',
    children: [image],
  });

  const text: HTMLSpanElement = createElement('span', {
    className: 'logo__text',
    text: 'MiniGames',
  });

  return createElement('a', {
    className: options.className === undefined ? 'logo' : `logo ${options.className}`,
    attributes: { href: getRouteHref(Route.Home) },
    children: [tile, text],
  });
}
