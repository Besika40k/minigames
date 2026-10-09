import {
  AuthFieldName,
  AuthMode,
  type AuthErrorMessages,
  type AuthFormContent,
  type AuthValidationMessages,
} from '../types/auth.ts';
import { IconName } from '../utils/create-icon.ts';

// The limits of the field rules
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 6;

export const AUTH_VALIDATION_MESSAGES: AuthValidationMessages = {
  emailRequired: 'Please enter your email address',
  emailFormat: 'Please enter a valid email address',
  usernameRequired: 'Please enter a username',
  usernameFirstLetter: 'Username must start with an uppercase English letter',
  usernameCharacters: 'Username may contain only English letters and digits',
  usernameLength: `Username must be ${String(USERNAME_MIN_LENGTH)} to ${String(USERNAME_MAX_LENGTH)} characters long`,
  passwordRequired: 'Please enter your password',
  passwordLength: `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters long`,
  passwordCharacters: 'Password may contain only English letters, digits and special characters',
  passwordUppercase: 'Password must contain an uppercase English letter',
  passwordDigit: 'Password must contain a digit',
  passwordSpecial: 'Password must contain a special character, such as ! or #',
  confirmPasswordRequired: 'Please repeat your password',
  confirmPasswordMismatch: 'Passwords do not match',
};

// What a failed sign-in, sign-up or sign-out says, by Firebase error code
const WRONG_CREDENTIALS = 'Wrong email or password.';
const SIGN_IN_UNAVAILABLE = 'Sign-in is not available right now. Please try again later.';

export const AUTH_ERROR_MESSAGES: AuthErrorMessages = {
  canceled: 'Google sign-in was canceled.',
  unknown: 'Something went wrong. Please try again.',
  byCode: {
    'auth/invalid-credential': WRONG_CREDENTIALS,
    'auth/wrong-password': WRONG_CREDENTIALS,
    'auth/user-not-found': WRONG_CREDENTIALS,
    'auth/invalid-email': 'This email address is not valid.',
    'auth/user-disabled': 'This account is disabled.',
    'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
    'auth/weak-password': 'This password is too weak. Choose a stronger one.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed':
      'The sign-in service cannot be reached. Check your connection and try again.',
    'auth/popup-blocked':
      'The browser blocked the Google window. Allow pop-ups for this site and try again.',
    'auth/account-exists-with-different-credential':
      'This email already has an account with a password. Log in with your email instead.',
    // The project config is missing or does not allow this sign-in
    'auth/invalid-api-key': SIGN_IN_UNAVAILABLE,
    'auth/configuration-not-found': SIGN_IN_UNAVAILABLE,
    'auth/operation-not-allowed': SIGN_IN_UNAVAILABLE,
    'auth/unauthorized-domain': SIGN_IN_UNAVAILABLE,
  },
};

// The codes of a Google window the visitor closed or replaced with another one
export const CANCELED_AUTH_CODES: ReadonlySet<string> = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

export const AUTH_DIALOG_LABEL = 'Log in or sign up';
export const AUTH_TABS_LABEL = 'Account form';

// The tabs follow this order
export const AUTH_MODES: readonly AuthMode[] = [AuthMode.Login, AuthMode.Register];

export const AUTH_CONTENT: Readonly<Record<AuthMode, AuthFormContent>> = {
  [AuthMode.Login]: {
    tabLabel: 'Login',
    title: 'Welcome Back!',
    description: 'Sign in to resume your games and progress.',
    fields: [
      {
        name: AuthFieldName.Email,
        label: 'Email Address',
        type: 'email',
        icon: IconName.Mail,
        placeholder: 'e.g. alex@minigames.com',
        autocomplete: 'email',
      },
      {
        name: AuthFieldName.Password,
        label: 'Password',
        type: 'password',
        icon: IconName.Lock,
        placeholder: '••••••••',
        autocomplete: 'current-password',
        minLength: PASSWORD_MIN_LENGTH,
        canRevealPassword: true,
      },
    ],
    forgotPasswordText: 'Forgot Password?',
    submitText: 'Login',
    googleText: 'Continue with Google',
    switchQuestion: "Don't have an account?",
    switchLinkText: 'Register',
  },
  [AuthMode.Register]: {
    tabLabel: 'Register',
    title: 'Create Account',
    description: 'Join MiniGames to track your score & streak.',
    fields: [
      {
        name: AuthFieldName.Username,
        label: 'Username',
        type: 'text',
        icon: IconName.Person,
        placeholder: 'e.g. CozyGamer_99',
        autocomplete: 'username',
      },
      {
        name: AuthFieldName.Email,
        label: 'Email Address',
        type: 'email',
        icon: IconName.Mail,
        placeholder: 'your.email@domain.com',
        autocomplete: 'email',
      },
      {
        name: AuthFieldName.Password,
        label: 'Password',
        type: 'password',
        icon: IconName.Lock,
        placeholder: `Min. ${String(PASSWORD_MIN_LENGTH)} characters`,
        autocomplete: 'new-password',
        minLength: PASSWORD_MIN_LENGTH,
      },
      {
        name: AuthFieldName.ConfirmPassword,
        label: 'Confirm Password',
        type: 'password',
        icon: IconName.Lock,
        placeholder: 'Repeat your password',
        autocomplete: 'new-password',
      },
    ],
    submitText: 'Create Account',
    googleText: 'Sign up with Google',
    switchQuestion: 'Already have an account?',
    switchLinkText: 'Login',
  },
};
