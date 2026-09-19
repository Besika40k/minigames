const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export enum IconName {
  Burger = 'burger',
  Close = 'close',
}

interface IconDefinition {
  readonly viewBox: string;
  readonly path: string;
}

// Shapes measured from the mockups: three 2px bars, and a 1.5px cross.
const ICONS: Readonly<Record<IconName, IconDefinition>> = {
  [IconName.Burger]: {
    viewBox: '0 0 16 16',
    path: 'M0 2h16v2H0zM0 6h16v2H0zM0 10h16v2H0z',
  },
  [IconName.Close]: {
    viewBox: '0 0 10 10',
    path: 'M1.062 10 0 8.938 3.938 5 0 1.062 1.062 0 5 3.938 8.938 0 10 1.062 6.062 5 10 8.938 8.938 10 5 6.062z',
  },
};

export function createIcon(name: IconName): SVGSVGElement {
  const definition: IconDefinition = ICONS[name];

  const svg: SVGSVGElement = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', definition.viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path: SVGPathElement = document.createElementNS(SVG_NAMESPACE, 'path');
  path.setAttribute('d', definition.path);
  path.setAttribute('fill', 'currentColor');
  svg.append(path);

  return svg;
}
