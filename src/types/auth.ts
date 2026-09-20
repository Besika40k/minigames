import type { IconName } from '../utils/create-icon.ts';

// The two forms of the auth dialog. The values are used in ids and class names.
export enum AuthMode {
  Login = 'login',
  Register = 'register',
}

export interface AuthDialog {
  readonly element: HTMLDialogElement;
  // Shows the dialog with the form of the given mode selected
  readonly open: (mode: AuthMode) => void;
}

export interface AuthField {
  readonly name: string;
  readonly label: string;
  readonly type: 'text' | 'email' | 'password';
  readonly icon: IconName;
  readonly placeholder: string;
  readonly autocomplete: string;
  readonly minLength?: number;
  // Adds the eye button that shows the typed password
  readonly canRevealPassword?: boolean;
}

export interface AuthFormContent {
  readonly tabLabel: string;
  readonly title: string;
  readonly description: string;
  readonly fields: readonly AuthField[];
  readonly forgotPasswordText?: string;
  readonly submitText: string;
  readonly googleText: string;
  // The sentence at the bottom of the form and the link in it that switches
  // to the other form
  readonly switchQuestion: string;
  readonly switchLinkText: string;
}
