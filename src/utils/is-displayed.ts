// True when CSS currently renders the element, so media queries stay the only
// place that decides which layout is active.
export function isDisplayed(element: HTMLElement): boolean {
  return globalThis.getComputedStyle(element).display !== 'none';
}
