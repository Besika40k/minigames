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

export interface ButtonLinkOptions {
  readonly variant: ButtonVariant;
  readonly size: ButtonSize;
  readonly text: string;
  readonly href: string;
  readonly className?: string;
}

function getClassName(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  const classNames: string[] = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    ...(className === undefined ? [] : [className]),
  ];

  return classNames.join(' ');
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
  const attributes: Record<string, string> = {
    type: options.type ?? 'button',
    ...(options.label !== undefined && { 'aria-label': options.label }),
  };

  const button: HTMLButtonElement = createElement('button', {
    className: getClassName(options.variant, options.size, options.className),
    text: options.text,
    attributes,
    children: options.children,
  });

  if (options.onClick !== undefined) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}

// The busy buttons that had the keyboard focus when they were locked
const focusedWhileBusy: WeakSet<HTMLButtonElement> = new WeakSet<HTMLButtonElement>();

// A button whose request is under way is locked against a second click and
// shows the turning ring of the styles. The browser takes the focus away from
// a disabled button, so a button that had it gets it back once it is free,
// unless the focus has moved on to something else in the meantime.
export function setButtonBusy(button: HTMLButtonElement, isBusy: boolean): void {
  if (isBusy && document.activeElement === button) {
    focusedWhileBusy.add(button);
  }
  button.disabled = isBusy;
  button.setAttribute('aria-busy', String(isBusy));

  if (isBusy || !focusedWhileBusy.delete(button)) {
    return;
  }
  if (document.activeElement === null || document.activeElement === document.body) {
    button.focus();
  }
}

// A link that looks like a button: it leads to another page, so it is a real
// link that also opens in a new tab
export function createButtonLink(options: ButtonLinkOptions): HTMLAnchorElement {
  return createElement('a', {
    className: getClassName(options.variant, options.size, options.className),
    text: options.text,
    attributes: { href: options.href },
  });
}
