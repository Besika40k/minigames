import googleLogoUrl from '../../assets/images/google-logo.svg';
import { AUTH_CONTENT } from '../../data/auth.ts';
import { AuthMode, type AuthField, type AuthFormContent } from '../../types/auth.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { createElement } from '../../utils/create-element.ts';
import { createButton } from '../button/button.ts';
import { createAuthField } from './auth-field.ts';
import { getPanelId, getTabId } from './auth-ids.ts';

// The logo's own size, so the browser can reserve its space
const GOOGLE_LOGO_SIZE = '24';

const DIVIDER_TEXT = 'or';

// A button that looks like a link: it does something on the page instead of
// going to another address
function createLinkButton(text: string, onClick?: () => void): HTMLButtonElement {
  const button: HTMLButtonElement = createElement('button', {
    className: 'auth-dialog__link',
    text,
    attributes: { type: 'button' },
  });

  if (onClick !== undefined) {
    button.addEventListener('click', onClick);
  }

  return button;
}

function createHeader(content: AuthFormContent): HTMLElement {
  return createElement('div', {
    className: 'auth-dialog__header',
    children: [
      createElement('h2', { className: 'auth-dialog__title', text: content.title }),
      createElement('p', { className: 'auth-dialog__description', text: content.description }),
    ],
  });
}

function createForm(content: AuthFormContent, mode: AuthMode): HTMLFormElement {
  const fields: HTMLElement[] = content.fields.map((field: AuthField): HTMLElement =>
    createAuthField(field, mode),
  );

  // Resetting the password is not part of Story 1, so the link does nothing yet
  if (content.forgotPasswordText !== undefined) {
    fields.push(createLinkButton(content.forgotPasswordText));
  }

  const submit: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Large,
    type: 'submit',
    text: content.submitText,
    className: 'auth-dialog__submit',
  });

  const form: HTMLFormElement = createElement('form', {
    className: 'auth-dialog__form',
    // Checking the fields and sending them are not part of Story 1. Until then
    // the form neither shows the browser's messages nor reloads the page.
    attributes: { novalidate: '' },
    children: [
      createElement('div', { className: 'auth-dialog__fields', children: fields }),
      submit,
    ],
  });
  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
  });

  return form;
}

// Signing in with Google is not part of Story 1, so the button does nothing yet
function createGoogleButton(text: string): HTMLButtonElement {
  const logo: HTMLImageElement = createElement('img', {
    attributes: { src: googleLogoUrl, alt: '', width: GOOGLE_LOGO_SIZE, height: GOOGLE_LOGO_SIZE },
  });

  return createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Large,
    className: 'auth-dialog__google',
    children: [logo, createElement('span', { text })],
  });
}

// One form of the dialog, with the link at its bottom that switches to the other
export function createAuthPanel(mode: AuthMode, onSwitch: (mode: AuthMode) => void): HTMLElement {
  const content: AuthFormContent = AUTH_CONTENT[mode];
  const otherMode: AuthMode = mode === AuthMode.Login ? AuthMode.Register : AuthMode.Login;

  const switchLink: HTMLButtonElement = createLinkButton(content.switchLinkText, (): void => {
    onSwitch(otherMode);
  });

  return createElement('section', {
    className: 'auth-dialog__panel',
    attributes: { id: getPanelId(mode), role: 'tabpanel', 'aria-labelledby': getTabId(mode) },
    children: [
      createHeader(content),
      createForm(content, mode),
      createElement('p', { className: 'auth-dialog__divider', text: DIVIDER_TEXT }),
      createGoogleButton(content.googleText),
      createElement('p', {
        className: 'auth-dialog__switch',
        children: [`${content.switchQuestion} `, switchLink],
      }),
    ],
  });
}
