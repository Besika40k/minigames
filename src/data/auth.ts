import { AuthMode, type AuthFormContent } from '../types/auth.ts';
import { IconName } from '../utils/create-icon.ts';

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
        name: 'email',
        label: 'Email Address',
        type: 'email',
        icon: IconName.Mail,
        placeholder: 'e.g. alex@minigames.com',
        autocomplete: 'email',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        icon: IconName.Lock,
        placeholder: '••••••••',
        autocomplete: 'current-password',
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
        name: 'username',
        label: 'Username',
        type: 'text',
        icon: IconName.Person,
        placeholder: 'e.g. CozyGamer_99',
        autocomplete: 'username',
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        icon: IconName.Mail,
        placeholder: 'your.email@domain.com',
        autocomplete: 'email',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        icon: IconName.Lock,
        placeholder: 'Min. 8 characters',
        autocomplete: 'new-password',
        minLength: 8,
      },
      {
        name: 'confirm-password',
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
