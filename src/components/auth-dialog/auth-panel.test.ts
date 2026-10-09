import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AUTH_VALIDATION_MESSAGES as MESSAGES } from '../../data/auth.ts';
import { AuthFieldName, AuthMode, type AuthRequest } from '../../types/auth.ts';
import { getErrorId } from './auth-ids.ts';
import { createAuthPanel, type AuthPanel } from './auth-panel.ts';

type SubmitHandler = Mock<(request: AuthRequest) => Promise<void>>;

function renderPanel(
  mode: AuthMode,
  parent: HTMLElement = document.body,
  onSubmit: SubmitHandler = vi.fn<(request: AuthRequest) => Promise<void>>(),
  onGoogle: Mock<() => Promise<void>> = vi.fn<() => Promise<void>>().mockResolvedValue(),
): AuthPanel {
  const panel: AuthPanel = createAuthPanel(mode, {
    onSwitch: vi.fn<(mode: AuthMode) => void>(),
    onSubmit,
    onGoogle,
  });
  parent.append(panel.element);

  return panel;
}

function getInput(panel: AuthPanel, name: AuthFieldName): HTMLInputElement {
  const inputName: string = name;
  const input: HTMLInputElement | undefined = [...panel.element.querySelectorAll('input')].find(
    (candidate: HTMLInputElement): boolean => candidate.name === inputName,
  );
  if (input === undefined) {
    throw new Error(`No ${name} input`);
  }

  return input;
}

function getSubmit(panel: AuthPanel): HTMLButtonElement {
  const submit: HTMLButtonElement | null = panel.element.querySelector('button[type="submit"]');
  if (submit === null) {
    throw new Error('No submit button');
  }

  return submit;
}

// The text under a field, or undefined while its error is hidden
function getError(panel: AuthPanel, mode: AuthMode, name: AuthFieldName): string | undefined {
  const error: HTMLElement | null = panel.element.querySelector(`#${getErrorId(mode, name)}`);

  return error === null || error.hidden ? undefined : (error.textContent ?? '');
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function leave(input: HTMLInputElement): void {
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('auth form validation', (): void => {
  it('starts without errors and with a disabled submit button', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Register);

    for (const name of Object.values(AuthFieldName)) {
      expect(getError(panel, AuthMode.Register, name)).toBeUndefined();
    }
    expect(getSubmit(panel).disabled).toBe(true);
  });

  it('shows an inline error while the user types and clears it once the value is valid', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Login);
    const email: HTMLInputElement = getInput(panel, AuthFieldName.Email);

    type(email, 'alex@invalid');

    expect(getError(panel, AuthMode.Login, AuthFieldName.Email)).toBe(MESSAGES.emailFormat);
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe(
      getErrorId(AuthMode.Login, AuthFieldName.Email),
    );

    type(email, 'alex@minigames.com');

    expect(getError(panel, AuthMode.Login, AuthFieldName.Email)).toBeUndefined();
    expect(email.hasAttribute('aria-invalid')).toBe(false);
    expect(email.hasAttribute('aria-describedby')).toBe(false);
  });

  it('shows the required error when the user leaves an empty field', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Login);

    leave(getInput(panel, AuthFieldName.Password));

    expect(getError(panel, AuthMode.Login, AuthFieldName.Password)).toBe(MESSAGES.passwordRequired);
    expect(getError(panel, AuthMode.Login, AuthFieldName.Email)).toBeUndefined();
  });

  it('enables login once every field is valid, without the registration password rules', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Login);

    type(getInput(panel, AuthFieldName.Email), 'alex@minigames.com');
    expect(getSubmit(panel).disabled).toBe(true);

    type(getInput(panel, AuthFieldName.Password), 'simple');
    expect(getSubmit(panel).disabled).toBe(false);

    type(getInput(panel, AuthFieldName.Password), 'short');
    expect(getSubmit(panel).disabled).toBe(true);
  });

  it('enables registration only when all four fields are valid', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Register);

    type(getInput(panel, AuthFieldName.Username), 'CozyGamer99');
    type(getInput(panel, AuthFieldName.Email), 'cozy@minigames.com');
    type(getInput(panel, AuthFieldName.Password), 'Secret1!');
    expect(getSubmit(panel).disabled).toBe(true);

    type(getInput(panel, AuthFieldName.ConfirmPassword), 'Secret1!');
    expect(getSubmit(panel).disabled).toBe(false);

    type(getInput(panel, AuthFieldName.Username), 'cozyGamer99');
    expect(getSubmit(panel).disabled).toBe(true);
    expect(getError(panel, AuthMode.Register, AuthFieldName.Username)).toBe(
      MESSAGES.usernameFirstLetter,
    );
  });

  it('checks the confirmation again whenever the password changes', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Register);
    const password: HTMLInputElement = getInput(panel, AuthFieldName.Password);

    type(password, 'Secret1!');
    // An untouched confirmation shows nothing yet
    expect(getError(panel, AuthMode.Register, AuthFieldName.ConfirmPassword)).toBeUndefined();

    type(getInput(panel, AuthFieldName.ConfirmPassword), 'Secret1!');
    expect(getError(panel, AuthMode.Register, AuthFieldName.ConfirmPassword)).toBeUndefined();

    type(password, 'Secret2!');
    expect(getError(panel, AuthMode.Register, AuthFieldName.ConfirmPassword)).toBe(
      MESSAGES.confirmPasswordMismatch,
    );

    type(password, 'Secret1!');
    expect(getError(panel, AuthMode.Register, AuthFieldName.ConfirmPassword)).toBeUndefined();
  });

  it('ignores the focus loss of a closing dialog', (): void => {
    const dialog: HTMLDialogElement = document.createElement('dialog');
    document.body.append(dialog);
    const panel: AuthPanel = renderPanel(AuthMode.Login, dialog);

    leave(getInput(panel, AuthFieldName.Email));

    expect(getError(panel, AuthMode.Login, AuthFieldName.Email)).toBeUndefined();
  });

  it('empties the fields, clears the errors and hides a shown password on reset', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Login);
    const email: HTMLInputElement = getInput(panel, AuthFieldName.Email);
    const password: HTMLInputElement = getInput(panel, AuthFieldName.Password);
    type(email, 'alex@');
    type(password, 'simple');
    panel.element.querySelector<HTMLButtonElement>('.auth-dialog__reveal')?.click();
    expect(password.type).toBe('text');

    panel.reset();

    expect(email.value).toBe('');
    expect(password.value).toBe('');
    expect(password.type).toBe('password');
    expect(getError(panel, AuthMode.Login, AuthFieldName.Email)).toBeUndefined();
    expect(getSubmit(panel).disabled).toBe(true);

    // The fields count as untouched again
    type(password, 'simple');
    expect(getError(panel, AuthMode.Login, AuthFieldName.Email)).toBeUndefined();
  });

  it('keeps the page from reloading on submit', (): void => {
    const panel: AuthPanel = renderPanel(AuthMode.Login);
    const form: HTMLFormElement | null = panel.element.querySelector('form');
    const event: SubmitEvent = new SubmitEvent('submit', { cancelable: true });

    form?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe('auth form submission', (): void => {
  it('sends the registration values, with the email trimmed', (): void => {
    const onSubmit: SubmitHandler = vi
      .fn<(request: AuthRequest) => Promise<void>>()
      .mockResolvedValue();
    const panel: AuthPanel = renderPanel(AuthMode.Register, document.body, onSubmit);
    type(getInput(panel, AuthFieldName.Username), 'CozyGamer99');
    type(getInput(panel, AuthFieldName.Email), ' cozy@minigames.com ');
    type(getInput(panel, AuthFieldName.Password), 'Secret1!');
    type(getInput(panel, AuthFieldName.ConfirmPassword), 'Secret1!');

    getSubmit(panel).click();

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      mode: AuthMode.Register,
      username: 'CozyGamer99',
      email: 'cozy@minigames.com',
      password: 'Secret1!',
    });
  });

  it('sends nothing while the form is invalid', (): void => {
    const onSubmit: SubmitHandler = vi.fn<(request: AuthRequest) => Promise<void>>();
    const panel: AuthPanel = renderPanel(AuthMode.Login, document.body, onSubmit);
    type(getInput(panel, AuthFieldName.Email), 'alex@');

    panel.element.querySelector('form')?.requestSubmit();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the busy text on the submit button until the request settles', async (): Promise<void> => {
    const onSubmit: SubmitHandler = vi
      .fn<(request: AuthRequest) => Promise<void>>()
      .mockResolvedValue();
    const panel: AuthPanel = renderPanel(AuthMode.Login, document.body, onSubmit);
    type(getInput(panel, AuthFieldName.Email), 'alex@minigames.com');
    type(getInput(panel, AuthFieldName.Password), 'simple');

    getSubmit(panel).click();

    expect(getSubmit(panel).textContent).toBe('Logging in…');
    expect(getSubmit(panel).getAttribute('aria-busy')).toBe('true');
    await vi.waitFor((): void => {
      expect(getSubmit(panel).textContent).toBe('Login');
    });
    expect(getSubmit(panel).getAttribute('aria-busy')).toBe('false');
    expect(getSubmit(panel).disabled).toBe(false);
  });
});
