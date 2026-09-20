import type { AuthField, AuthMode } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { getFieldId } from './auth-ids.ts';

const REVEAL_LABEL = 'Show password';

// The eye button switches its input between hiding and showing what is typed
function createRevealButton(input: HTMLInputElement): HTMLButtonElement {
  const button: HTMLButtonElement = createElement('button', {
    className: 'auth-dialog__reveal',
    attributes: { type: 'button', 'aria-label': REVEAL_LABEL, 'aria-pressed': 'false' },
    children: [createIcon(IconName.Visibility)],
  });

  button.addEventListener('click', (): void => {
    const isRevealed: boolean = input.type === 'password';
    input.type = isRevealed ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(isRevealed));
    button.replaceChildren(createIcon(isRevealed ? IconName.VisibilityOff : IconName.Visibility));
  });

  return button;
}

export function createAuthField(field: AuthField, mode: AuthMode): HTMLDivElement {
  const id: string = getFieldId(mode, field.name);
  const hasRevealButton: boolean = field.canRevealPassword === true;

  // The dialog's forms do not check their fields yet (see createAuthPanel), but
  // `required` and `minlength` already say what a field expects
  const input: HTMLInputElement = createElement('input', {
    className: hasRevealButton
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

  // The icon comes after the input so that the input's state can restyle it
  const icon: SVGSVGElement = createIcon(field.icon);
  icon.classList.add('auth-dialog__icon');

  const control: HTMLDivElement = createElement('div', {
    className: 'auth-dialog__control',
    children: [input, icon, ...(hasRevealButton ? [createRevealButton(input)] : [])],
  });

  const label: HTMLLabelElement = createElement('label', {
    className: 'auth-dialog__label',
    text: field.label,
    attributes: { for: id },
  });

  return createElement('div', { className: 'auth-dialog__field', children: [label, control] });
}
