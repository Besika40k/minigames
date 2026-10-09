import type { IconName } from '../utils/create-icon.ts';

// The two forms of the auth dialog. The values are used in ids and class names.
export enum AuthMode {
  Login = 'login',
  Register = 'register',
}

export interface AuthDialog {
  readonly element: HTMLDialogElement;
  // Shows the dialog with the form of the given mode selected
  readonly show: (mode: AuthMode) => void;
  readonly hide: () => void;
}

// The fields of the two forms. The values are the inputs' names and parts of their ids.
export enum AuthFieldName {
  Username = 'username',
  Email = 'email',
  Password = 'password',
  ConfirmPassword = 'confirm-password',
}

export interface AuthField {
  readonly name: AuthFieldName;
  readonly label: string;
  readonly type: 'text' | 'email' | 'password';
  readonly icon: IconName;
  readonly placeholder: string;
  readonly autocomplete: string;
  readonly minLength?: number;
  // Adds the eye button that shows the typed password
  readonly canRevealPassword?: boolean;
}

// The inline error texts of the field rules
export interface AuthValidationMessages {
  readonly emailRequired: string;
  readonly emailFormat: string;
  readonly usernameRequired: string;
  readonly usernameFirstLetter: string;
  readonly usernameCharacters: string;
  readonly usernameLength: string;
  readonly passwordRequired: string;
  readonly passwordLength: string;
  readonly passwordCharacters: string;
  readonly passwordUppercase: string;
  readonly passwordDigit: string;
  readonly passwordSpecial: string;
  readonly confirmPasswordRequired: string;
  readonly confirmPasswordMismatch: string;
}

export interface AuthFormContent {
  readonly tabLabel: string;
  readonly title: string;
  readonly description: string;
  readonly fields: readonly AuthField[];
  readonly forgotPasswordText?: string;
  readonly submitText: string;
  // The submit button's text while the request is under way
  readonly pendingText: string;
  readonly googleText: string;
  // The Google button's text while Google's window is open
  readonly googlePendingText: string;
  // The sentence at the bottom of the form and the link in it that switches
  // to the other form
  readonly switchQuestion: string;
  readonly switchLinkText: string;
}

// The values of a valid form, ready to send
export type AuthRequest =
  | {
      readonly mode: AuthMode.Login;
      readonly email: string;
      readonly password: string;
    }
  | {
      readonly mode: AuthMode.Register;
      readonly username: string;
      readonly email: string;
      readonly password: string;
    };

// The signed-in user as the app keeps it: no password and no Firebase token
export interface AuthProfile {
  readonly displayName: string;
  readonly email: string;
  // The account picture, when the account has one (Google)
  readonly avatarUrl?: string;
}

export interface AuthErrorMessages {
  // A Google window the visitor closed
  readonly canceled: string;
  // Any failure without a message of its own
  readonly unknown: string;
  readonly byCode: Readonly<Partial<Record<string, string>>>;
}
