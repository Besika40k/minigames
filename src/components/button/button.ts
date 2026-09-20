import type { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { createElement } from '../../utils/create-element.ts';
import './button.scss';

export interface ButtonOptions {
  readonly variant: ButtonVariant;
  readonly size: ButtonSize;
  // Only a button that submits a form needs `submit`
  readonly type?: 'button' | 'submit';
  readonly text?: string;
  readonly label?: string;
  readonly className?: string;
  readonly children?: readonly Node[];
  readonly onClick?: () => void;
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
  const classNames: string[] = [
    'button',
    `button--${options.variant}`,
    `button--${options.size}`,
    ...(options.className === undefined ? [] : [options.className]),
  ];

  const attributes: Record<string, string> = {
    type: options.type ?? 'button',
    ...(options.label !== undefined && { 'aria-label': options.label }),
  };

  const button: HTMLButtonElement = createElement('button', {
    className: classNames.join(' '),
    text: options.text,
    attributes,
    children: options.children,
  });

  if (options.onClick !== undefined) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}
