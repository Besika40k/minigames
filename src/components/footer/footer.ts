import { getRouteHref } from '../../app/router.ts';
import { FOOTER_CONTENT } from '../../data/footer.ts';
import type { ExternalLink, FooterColumn, FooterLink, SocialLink } from '../../types/footer.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { createLogo } from '../logo/logo.ts';
import './footer.scss';

function createAbout(): HTMLElement {
  return createElement('div', {
    className: 'footer__about',
    children: [
      createLogo({ className: 'footer__logo' }),
      createElement('p', { className: 'footer__tagline', text: FOOTER_CONTENT.tagline }),
    ],
  });
}

function createLinkItem(link: FooterLink): HTMLLIElement {
  return createElement('li', {
    children: [
      createElement('a', {
        className: 'footer__link',
        text: link.label,
        attributes: { href: getRouteHref(link.route) },
      }),
    ],
  });
}

function createLinkColumn(column: FooterColumn): HTMLElement {
  const headingId: string = `footer-${column.title.toLowerCase()}`;
  const items: HTMLLIElement[] = column.links.map((link: FooterLink): HTMLLIElement =>
    createLinkItem(link),
  );

  return createElement('nav', {
    className: 'footer__column',
    attributes: { 'aria-labelledby': headingId },
    children: [
      createElement('h2', {
        className: 'footer__heading',
        text: column.title,
        attributes: { id: headingId },
      }),
      createElement('ul', { className: 'footer__list', children: items }),
    ],
  });
}

function createSocialColumn(): HTMLElement {
  const items: HTMLLIElement[] = FOOTER_CONTENT.socialLinks.map((link: SocialLink): HTMLLIElement =>
    createElement('li', {
      children: [
        createElement('a', {
          className: 'footer__social-link',
          attributes: { href: getRouteHref(link.route), 'aria-label': link.label },
          children: [createIcon(link.icon)],
        }),
      ],
    }),
  );

  return createElement('div', {
    className: 'footer__column',
    children: [
      createElement('h2', { className: 'footer__heading', text: FOOTER_CONTENT.communityTitle }),
      createElement('ul', { className: 'footer__list footer__list--social', children: items }),
    ],
  });
}

function createColumns(): HTMLElement {
  const linkColumns: HTMLElement[] = FOOTER_CONTENT.columns.map(
    (column: FooterColumn): HTMLElement => createLinkColumn(column),
  );

  return createElement('div', {
    className: 'footer__columns',
    children: [...linkColumns, createSocialColumn()],
  });
}

function createBadge(modifier: string, child: Node | string): HTMLSpanElement {
  return createElement('span', {
    className: `footer__badge footer__badge--${modifier}`,
    attributes: { 'aria-hidden': 'true' },
    children: [child],
  });
}

function createCredit(link: ExternalLink, badge: HTMLSpanElement): HTMLAnchorElement {
  return createElement('a', {
    className: 'footer__credit',
    attributes: { href: link.url, target: '_blank', rel: 'noopener noreferrer' },
    children: [badge, link.label],
  });
}

function createBottomBar(): HTMLElement {
  const year: number = new Date().getFullYear();
  const courseBadge: HTMLSpanElement = createBadge('course', 'RS');
  const developerBadge: HTMLSpanElement = createBadge('developer', createIcon(IconName.Code));

  return createElement('div', {
    className: 'footer__bottom',
    children: [
      createElement('p', {
        className: 'footer__copyright',
        text: `© ${year} MiniGames. All rights reserved.`,
      }),
      createCredit(FOOTER_CONTENT.courseLink, courseBadge),
      createCredit(FOOTER_CONTENT.developerLink, developerBadge),
      createElement('p', { className: 'footer__note', text: FOOTER_CONTENT.designCredit }),
    ],
  });
}

export function createFooter(): HTMLElement {
  const main: HTMLElement = createElement('div', {
    className: 'footer__main',
    children: [createAbout(), createColumns()],
  });

  const inner: HTMLElement = createElement('div', {
    className: 'footer__inner',
    children: [main, createBottomBar()],
  });

  return createElement('footer', { className: 'footer', children: [inner] });
}
