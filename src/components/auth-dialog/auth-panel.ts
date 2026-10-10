import googleLogoUrl from '../../assets/images/google-logo.svg';
import { validateAuthField, type AuthValues } from '../../auth/validation.ts';
import { AUTH_CONTENT } from '../../data/auth.ts';
import {
  AuthFieldName,
  AuthMode,
  type AuthField,
  type AuthFormContent,
  type AuthRequest,
} from '../../types/auth.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { createElement } from '../../utils/create-element.ts';
import { createButton } from '../button/button.ts';
import { createAuthField, type AuthFieldView } from './auth-field.ts';
import { getPanelId, getTabId } from './auth-ids.ts';

export interface AuthPanelActions {
  // Switches to the other form: the link at the bottom of a form
  readonly onSwitch: (mode: AuthMode) => void;
  // Sends the values of a valid form. The submit button shows that the
  // request is under way until the promise settles.
  readonly onSubmit: (request: AuthRequest) => Promise<void>;
  // Signs in through Google's window. The Google button shows that it is
  // waiting until the promise settles.
  readonly onGoogle: () => Promise<void>;
}

export interface AuthPanel {
  readonly element: HTMLElement;
  // Empties the form, clears its errors and disables its submit button
  readonly reset: () => void;
}

interface AuthPanelForm {
  readonly element: HTMLFormElement;
  readonly reset: () => void;
}

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

// The request of a valid form. The email loses the spaces around it, which
// its check ignores too.
function createAuthRequest(mode: AuthMode, values: AuthValues): AuthRequest {
  const email: string = (values[AuthFieldName.Email] ?? '').trim();
  const password: string = values[AuthFieldName.Password] ?? '';

  return mode === AuthMode.Register
    ? { mode, username: values[AuthFieldName.Username] ?? '', email, password }
    : { mode, email, password };
}

// A form checks its fields as the visitor types. A field shows its error once
// the visitor has typed in it or left it, so a new form is not covered in
// errors, and the submit button waits until every field is valid.
function createForm(
  content: AuthFormContent,
  mode: AuthMode,
  onSubmit: (request: AuthRequest) => Promise<void>,
): AuthPanelForm {
  const fields: AuthFieldView[] = content.fields.map((field: AuthField): AuthFieldView =>
    createAuthField(field, mode),
  );
  const touchedFields: Set<AuthFieldName> = new Set<AuthFieldName>();

  // Resetting the password is not part of Story 1, so the link does nothing yet
  const forgotPasswordLink: HTMLButtonElement[] =
    content.forgotPasswordText === undefined ? [] : [createLinkButton(content.forgotPasswordText)];

  const submit: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Large,
    type: 'submit',
    text: content.submitText,
    className: 'auth-dialog__submit',
  });
  submit.disabled = true;

  const form: HTMLFormElement = createElement('form', {
    className: 'auth-dialog__form',
    // The form shows its own messages instead of the browser's
    attributes: { novalidate: '' },
    children: [
      createElement('div', {
        className: 'auth-dialog__fields',
        children: [
          ...fields.map((field: AuthFieldView): HTMLElement => field.element),
          ...forgotPasswordLink,
        ],
      }),
      submit,
    ],
  });

  // Checks every field, because a rule can read another field: the
  // confirmation changes with the password
  const getValues = (): AuthValues =>
    Object.fromEntries(
      fields.map((field: AuthFieldView): [AuthFieldName, string] => [
        field.name,
        field.input.value,
      ]),
    );

  const update = (): void => {
    const values: AuthValues = getValues();
    let invalidCount: number = 0;
    for (const field of fields) {
      const error: string | undefined = validateAuthField(mode, field.name, values);
      if (error !== undefined) {
        invalidCount += 1;
      }
      field.setError(touchedFields.has(field.name) ? error : undefined);
    }
    submit.disabled = invalidCount > 0;
  };

  const touch = (target: EventTarget | null): void => {
    const field: AuthFieldView | undefined = fields.find(
      (candidate: AuthFieldView): boolean => candidate.input === target,
    );
    if (field === undefined) {
      return;
    }
    touchedFields.add(field.name);
    update();
  };

  form.addEventListener('input', (event: Event): void => {
    touch(event.target);
  });
  form.addEventListener('focusout', (event: FocusEvent): void => {
    // Closing the dialog takes the focus away too, but the visitor has not
    // left the field for another one
    if (form.closest('dialog')?.open === false) {
      return;
    }
    touch(event.target);
  });

  // While the request is under way the button says so, and the dialog keeps
  // every control locked
  const setBusy = (isBusy: boolean): void => {
    submit.textContent = isBusy ? content.pendingText : content.submitText;
    submit.setAttribute('aria-busy', String(isBusy));
  };

  const send = async (request: AuthRequest): Promise<void> => {
    setBusy(true);
    try {
      await onSubmit(request);
    } finally {
      setBusy(false);
      update();
    }
  };

  // The page never reloads: the app handles the values itself. Only a valid
  // form that is not already sending goes out.
  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
    if (submit.disabled) {
      return;
    }
    void send(createAuthRequest(mode, getValues()));
  });

  return {
    element: form,
    reset: (): void => {
      for (const field of fields) {
        field.reset();
      }
      touchedFields.clear();
      submit.disabled = true;
    },
  };
}

// The Google button says that it waits while Google's window is open
function createGoogleButton(
  content: AuthFormContent,
  onGoogle: () => Promise<void>,
): HTMLButtonElement {
  const logo: HTMLImageElement = createElement('img', {
    attributes: { src: googleLogoUrl, alt: '', width: GOOGLE_LOGO_SIZE, height: GOOGLE_LOGO_SIZE },
  });
  const label: HTMLSpanElement = createElement('span', { text: content.googleText });
  const button: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Large,
    className: 'auth-dialog__google',
    children: [logo, label],
  });

  const setBusy = (isBusy: boolean): void => {
    label.textContent = isBusy ? content.googlePendingText : content.googleText;
    button.setAttribute('aria-busy', String(isBusy));
  };

  const signIn = async (): Promise<void> => {
    setBusy(true);
    try {
      await onGoogle();
    } finally {
      setBusy(false);
    }
  };

  button.addEventListener('click', (): void => {
    void signIn();
  });

  return button;
}

// One form of the dialog, with the link at its bottom that switches to the other
export function createAuthPanel(mode: AuthMode, actions: AuthPanelActions): AuthPanel {
  const content: AuthFormContent = AUTH_CONTENT[mode];
  const otherMode: AuthMode = mode === AuthMode.Login ? AuthMode.Register : AuthMode.Login;
  const form: AuthPanelForm = createForm(content, mode, actions.onSubmit);

  const switchLink: HTMLButtonElement = createLinkButton(content.switchLinkText, (): void => {
    actions.onSwitch(otherMode);
  });

  const element: HTMLElement = createElement('section', {
    className: 'auth-dialog__panel',
    attributes: { id: getPanelId(mode), role: 'tabpanel', 'aria-labelledby': getTabId(mode) },
    children: [
      createHeader(content),
      form.element,
      createElement('p', { className: 'auth-dialog__divider', text: DIVIDER_TEXT }),
      createGoogleButton(content, actions.onGoogle),
      createElement('p', {
        className: 'auth-dialog__switch',
        children: [`${content.switchQuestion} `, switchLink],
      }),
    ],
  });

  return { element, reset: form.reset };
}
