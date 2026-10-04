import { createElement } from '../../utils/create-element.ts';
import './skeleton.scss';

// A grey block that holds the place of content while it loads; the class
// gives it the size of that content. Screen readers skip it: the loading area
// says it is busy instead.
export function createSkeleton(className: string): HTMLSpanElement {
  return createElement('span', {
    className: `skeleton ${className}`,
    attributes: { 'aria-hidden': 'true' },
  });
}
