import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthFieldName, AuthMode, type AuthDialog, type AuthRequest } from '../../types/auth.ts';
import { createAuthDialog } from './auth-dialog.ts';
import { getFieldId, getPanelId, getTabId } from './auth-ids.ts';

type SubmitHandler = Mock<(request: AuthRequest) => Promise<void>>;

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
}

// A request that settles when the test says so
function createDeferred(): Deferred {
  const handlers: { resolve?: () => void; reject?: (error: Error) => void } = {};
  const promise: Promise<void> = new Promise<void>(
    (resolve: () => void, reject: (error: Error) => void): void => {
      handlers.resolve = resolve;
      handlers.reject = reject;
    },
  );

  return {
    promise,
    resolve: (): void => handlers.resolve?.(),
    reject: (error: Error): void => handlers.reject?.(error),
  };
}

function createPendingSubmit(deferred: Deferred): SubmitHandler {
  return vi.fn<(request: AuthRequest) => Promise<void>>((): Promise<void> => deferred.promise);
}

function createInstantSubmit(): SubmitHandler {
  return vi.fn<(request: AuthRequest) => Promise<void>>().mockResolvedValue();
}

interface TestDialog {
  readonly dialog: AuthDialog;
  readonly onClose: Mock<() => void>;
  readonly onSubmit: SubmitHandler;
}

function renderDialog(
  onSubmit: SubmitHandler,
  onGoogle: Mock<() => Promise<void>> = vi.fn<() => Promise<void>>().mockResolvedValue(),
): TestDialog {
  const onClose: Mock<() => void> = vi.fn<() => void>();
  const dialog: AuthDialog = createAuthDialog({ onClose, onSubmit, onGoogle });
  document.body.append(dialog.element);
  dialog.show(AuthMode.Login);

  return { dialog, onClose, onSubmit };
}

function getById<T extends HTMLElement>(id: string): T {
  const element: T | null = document.querySelector<T>(`#${id}`);
  if (element === null) {
    throw new Error(`No #${id}`);
  }

  return element;
}

function getSubmit(): HTMLButtonElement {
  const submit: HTMLButtonElement | null = getById(getPanelId(AuthMode.Login)).querySelector(
    ':scope .auth-dialog__submit',
  );
  if (submit === null) {
    throw new Error('No submit button');
  }

  return submit;
}

function type(id: string, value: string): void {
  const input: HTMLInputElement = getById<HTMLInputElement>(id);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillLogin(): void {
  type(getFieldId(AuthMode.Login, AuthFieldName.Email), ' alex@minigames.com ');
  type(getFieldId(AuthMode.Login, AuthFieldName.Password), 'simple');
}

function getControls(dialog: AuthDialog): (HTMLButtonElement | HTMLInputElement)[] {
  return [
    ...dialog.element.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input'),
  ];
}

function isDisabled(control: HTMLButtonElement | HTMLInputElement): boolean {
  return control.disabled;
}

// Which controls of the dialog are disabled, in their order
function getDisabledStates(dialog: AuthDialog): boolean[] {
  return getControls(dialog).map((control: HTMLButtonElement | HTMLInputElement): boolean =>
    isDisabled(control),
  );
}

function pressEscape(dialog: AuthDialog): void {
  dialog.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

// Lets the promise chains of the dialog run
async function settle(): Promise<void> {
  await vi.waitFor((): void => {
    expect(getSubmit().getAttribute('aria-busy')).toBe('false');
  });
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('auth dialog while a request is under way', (): void => {
  it('sends the values of a valid form once', (): void => {
    const deferred: Deferred = createDeferred();
    const { onSubmit } = renderDialog(createPendingSubmit(deferred));
    fillLogin();

    getSubmit().click();
    getSubmit().click();

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      mode: AuthMode.Login,
      email: 'alex@minigames.com',
      password: 'simple',
    });
  });

  it('locks every control and shows the busy submit button', (): void => {
    const deferred: Deferred = createDeferred();
    const { dialog } = renderDialog(createPendingSubmit(deferred));
    fillLogin();

    getSubmit().click();

    for (const control of getControls(dialog)) {
      expect(control.disabled, control.outerHTML).toBe(true);
    }
    expect(getSubmit().getAttribute('aria-busy')).toBe('true');
    expect(getSubmit().textContent).toBe('Logging in…');
    expect(getById(getTabId(AuthMode.Register)).hasAttribute('disabled')).toBe(true);
  });

  it('cannot be closed with Esc, the cancel request or the backdrop', (): void => {
    const deferred: Deferred = createDeferred();
    const { dialog, onClose } = renderDialog(createPendingSubmit(deferred));
    fillLogin();
    getSubmit().click();

    pressEscape(dialog);
    dialog.element.dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.element.open).toBe(true);
  });

  it('unlocks the controls for another try after a failure', async (): Promise<void> => {
    const deferred: Deferred = createDeferred();
    const { dialog, onClose } = renderDialog(createPendingSubmit(deferred));
    fillLogin();
    const disabledBefore: boolean[] = getDisabledStates(dialog);
    getSubmit().click();

    deferred.reject(new Error('Wrong email or password.'));
    await settle();

    // Every control is as before: the empty registration form keeps its
    // submit button disabled
    expect(getDisabledStates(dialog)).toEqual(disabledBefore);
    expect(disabledBefore.filter(Boolean)).toHaveLength(1);
    expect(getSubmit().textContent).toBe('Login');
    // The values stay, so the visitor can correct them
    expect(
      getById<HTMLInputElement>(getFieldId(AuthMode.Login, AuthFieldName.Password)).value,
    ).toBe('simple');

    pressEscape(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps an invalid form from being sent after the request', async (): Promise<void> => {
    const deferred: Deferred = createDeferred();
    renderDialog(createPendingSubmit(deferred));
    fillLogin();
    getSubmit().click();
    type(getFieldId(AuthMode.Login, AuthFieldName.Password), 'short');

    deferred.resolve();
    await settle();

    expect(getSubmit().disabled).toBe(true);
  });
});

describe('auth dialog without a request', (): void => {
  it('closes with Esc through its owner', (): void => {
    const { dialog, onClose } = renderDialog(createInstantSubmit());

    pressEscape(dialog);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('switches to another form while open, and hides', (): void => {
    const { dialog } = renderDialog(createInstantSubmit());

    dialog.show(AuthMode.Register);
    expect(getById(getTabId(AuthMode.Register)).getAttribute('aria-selected')).toBe('true');

    dialog.hide();
    expect(dialog.element.open).toBe(false);
  });
});

describe('auth dialog during a Google sign-in', (): void => {
  it('locks the dialog until Google answers', async (): Promise<void> => {
    const deferred: Deferred = createDeferred();
    const onGoogle: Mock<() => Promise<void>> = vi.fn<() => Promise<void>>(
      (): Promise<void> => deferred.promise,
    );
    const { dialog, onClose } = renderDialog(createInstantSubmit(), onGoogle);
    const google: HTMLButtonElement | null = dialog.element.querySelector('.auth-dialog__google');

    google?.click();
    google?.click();
    pressEscape(dialog);

    expect(onGoogle).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      getControls(dialog).every((control: HTMLButtonElement | HTMLInputElement): boolean =>
        isDisabled(control),
      ),
    ).toBe(true);

    deferred.resolve();
    await vi.waitFor((): void => {
      expect(google?.getAttribute('aria-busy')).toBe('false');
    });
    expect(
      getControls(dialog).some((control: HTMLButtonElement | HTMLInputElement): boolean =>
        isDisabled(control),
      ),
    ).toBe(true);
    expect(google?.disabled).toBe(false);
  });
});
