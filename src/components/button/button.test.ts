import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { createButton, createButtonLink, setButtonBusy } from './button.ts';

function renderButton(): HTMLButtonElement {
  const button: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Medium,
    text: 'Save',
  });
  document.body.append(button);

  return button;
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('createButton', (): void => {
  it('makes a plain button with the classes of its variant and size', (): void => {
    const onClick: Mock<() => void> = vi.fn<() => void>();
    const button: HTMLButtonElement = createButton({
      variant: ButtonVariant.Filled,
      size: ButtonSize.Small,
      label: 'Open menu',
      className: 'header__burger',
      onClick,
    });

    button.click();

    expect(button.type).toBe('button');
    expect(button.className).toBe('button button--filled button--small header__burger');
    expect(button.getAttribute('aria-label')).toBe('Open menu');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('makes a submit button only when asked', (): void => {
    const button: HTMLButtonElement = createButton({
      variant: ButtonVariant.Filled,
      size: ButtonSize.Large,
      type: 'submit',
      text: 'Send',
    });

    expect(button.type).toBe('submit');
    expect(button.hasAttribute('aria-label')).toBe(false);
  });
});

describe('createButtonLink', (): void => {
  it('makes a real link that looks like a button', (): void => {
    const link: HTMLAnchorElement = createButtonLink({
      variant: ButtonVariant.Outlined,
      size: ButtonSize.Medium,
      text: 'See all',
      href: '/library',
    });

    expect(link.getAttribute('href')).toBe('/library');
    expect(link.className).toBe('button button--outlined button--medium');
    expect(link.textContent).toBe('See all');
  });
});

describe('setButtonBusy', (): void => {
  it('locks the button while its request is under way and frees it after', (): void => {
    const button: HTMLButtonElement = renderButton();

    setButtonBusy(button, true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    setButtonBusy(button, false);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('false');
  });

  it('gives the focus back that the browser took from the locked button', (): void => {
    const button: HTMLButtonElement = renderButton();
    button.focus();

    setButtonBusy(button, true);
    // What the browser does to a focused button that becomes disabled
    button.blur();
    setButtonBusy(button, false);

    expect(document.activeElement).toBe(button);
  });

  it('leaves the focus where the user has moved it in the meantime', (): void => {
    const button: HTMLButtonElement = renderButton();
    const other: HTMLButtonElement = renderButton();
    button.focus();

    setButtonBusy(button, true);
    other.focus();
    setButtonBusy(button, false);

    expect(document.activeElement).toBe(other);
  });

  it('does not take the focus when the button did not have it', (): void => {
    const button: HTMLButtonElement = renderButton();

    setButtonBusy(button, true);
    setButtonBusy(button, false);

    expect(document.activeElement).toBe(document.body);
  });
});
