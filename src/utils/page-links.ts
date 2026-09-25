import type { Route } from '../types/route.ts';

interface PageLink {
  readonly element: HTMLAnchorElement;
  readonly page: Route;
}

// The links of one navigation that lead to a real page. When the open page
// changes, its link gets aria-current="page", which also styles it; the others
// get "false", which means the same as no attribute.
export class PageLinks {
  private readonly links: PageLink[] = [];

  public add(element: HTMLAnchorElement, page: Route): void {
    this.links.push({ element, page });
  }

  public markCurrent(currentPage: Route | undefined): void {
    for (const link of this.links) {
      link.element.setAttribute('aria-current', link.page === currentPage ? 'page' : 'false');
    }
  }
}
