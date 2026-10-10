import type { AuthField, AuthFieldName, AuthMode } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { getErrorId, getFieldId } from './auth-ids.ts';

const REVEAL_LABEL = 'Show password';

export interface AuthFieldView {
  readonly element: HTMLDivElement;
  readonly name: AuthFieldName;
  readonly input: HTMLInputElement;
  // Shows the message under the input, or clears it with undefined
  readonly setError: (message: string | undefined) => void;
  // Empties the input, clears its error and hides a shown password again
  readonly reset: () => void;
}

interface RevealButton {
  readonly element: HTMLButtonElement;
  readonly hide: () => void;
}

// The eye button switches its input between hiding and showing what is typed
function createRevealButton(input: HTMLInputElement): RevealButton {
  const button: HTMLButtonElement = createElement('button', {
    className: 'auth-dialog__reveal',
    attributes: { type: 'button', 'aria-label': REVEAL_LABEL, 'aria-pressed': 'false' },
    children: [createIcon(IconName.Visibility)],
  });

  const setRevealed = (isRevealed: boolean): void => {
    input.type = isRevealed ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(isRevealed));
    button.replaceChildren(createIcon(isRevealed ? IconName.VisibilityOff : IconName.Visibility));
  };

  button.addEventListener('click', (): void => {
    setRevealed(input.type === 'password');
  });

  return {
    element: button,
    hide: (): void => {
      setRevealed(false);
    },
  };
}

export function createAuthField(field: AuthField, mode: AuthMode): AuthFieldView {
  const id: string = getFieldId(mode, field.name);
  const errorId: string = getErrorId(mode, field.name);

  // The form checks the fields itself (see createAuthPanel), but `required`
  // and `minlength` still say what a field expects
  const input: HTMLInputElement = createElement('input', {
    className:
      field.canRevealPassword === true
        ? 'auth-dialog__input auth-dialog__input--revealable'
        : 'auth-dialog__input',
    attributes: {
      id,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder,
      autocomplete: field.autocomplete,
      required: '',
      ...(field.minLength !== undefined && { minlength: String(field.minLength) }),
    },
  });

  const revealButton: RevealButton | undefined =
    field.canRevealPassword === true ? createRevealButton(input) : undefined;

  // The icon comes after the input so that the input's state can restyle it
  const icon: SVGSVGElement = createIcon(field.icon);
  icon.classList.add('auth-dialog__icon');

  const control: HTMLDivElement = createElement('div', {
    className: 'auth-dialog__control',
    children: [input, icon, ...(revealButton === undefined ? [] : [revealButton.element])],
  });

  const label: HTMLLabelElement = createElement('label', {
    className: 'auth-dialog__label',
    text: field.label,
    attributes: { for: id },
  });

  // Empty and hidden while the value is valid
  const error: HTMLParagraphElement = createElement('p', {
    className: 'auth-dialog__error',
    attributes: { id: errorId },
  });
  error.hidden = true;

  const setError = (message: string | undefined): void => {
    error.textContent = message ?? '';
    error.hidden = message === undefined;
    if (message === undefined) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      return;
    }
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorId);
  };

  return {
    element: createElement('div', {
      className: 'auth-dialog__field',
      children: [label, control, error],
    }),
    name: field.name,
    input,
    setError,
    reset: (): void => {
      input.value = '';
      setError(undefined);
      revealButton?.hide();
    },
  };
}
