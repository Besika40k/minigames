import { createElement } from '../../utils/create-element.ts';
import './section-title.scss';

// The heading of a home page section. The id lets the section name itself with
// `aria-labelledby`.
export function createSectionTitle(
  id: string,
  content: readonly (Node | string)[],
): HTMLHeadingElement {
  return createElement('h2', {
    className: 'section-title',
    attributes: { id },
    children: content,
  });
}
