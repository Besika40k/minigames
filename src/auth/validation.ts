import {
  AUTH_VALIDATION_MESSAGES as MESSAGES,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../data/auth.ts';
import { AuthFieldName, AuthMode } from '../types/auth.ts';

// The rules of the auth forms. Each check returns the message to show under the
// field, or undefined for a valid value. They read nothing from the page, so
// they are easy to test.

// A name, an @ and a domain with a dot. Dots only between characters, and the
// domain ends with letters, as in alex.pro@mail.minigames.com.
const EMAIL_PATTERN: RegExp =
  /^[\w%+-]+(?:\.[\w%+-]+)*@(?:[\da-z](?:[\da-z-]*[\da-z])?\.)+[a-z]{2,}$/i;

const UPPERCASE_FIRST_PATTERN: RegExp = /^[A-Z]/;
const LETTERS_AND_DIGITS_PATTERN: RegExp = /^[\dA-Za-z]+$/;
const UPPERCASE_PATTERN: RegExp = /[A-Z]/;
const DIGIT_PATTERN: RegExp = /\d/;
// Every printable English keyboard character from ! to ~: letters, digits and
// special characters, without spaces or letters of other alphabets
const PASSWORD_CHARACTERS_PATTERN: RegExp = /^[!-~]+$/;
const SPECIAL_PATTERN: RegExp = /[^\dA-Za-z]/;

// The values of a form's fields by their names
export type AuthValues = Readonly<Partial<Record<AuthFieldName, string>>>;

export function validateEmail(value: string): string | undefined {
  const email: string = value.trim();
  if (email === '') {
    return MESSAGES.emailRequired;
  }

  return EMAIL_PATTERN.test(email) ? undefined : MESSAGES.emailFormat;
}

export function validateUsername(value: string): string | undefined {
  if (value === '') {
    return MESSAGES.usernameRequired;
  }
  if (!UPPERCASE_FIRST_PATTERN.test(value)) {
    return MESSAGES.usernameFirstLetter;
  }
  if (!LETTERS_AND_DIGITS_PATTERN.test(value)) {
    return MESSAGES.usernameCharacters;
  }

  const isLengthValid: boolean =
    value.length >= USERNAME_MIN_LENGTH && value.length <= USERNAME_MAX_LENGTH;

  return isLengthValid ? undefined : MESSAGES.usernameLength;
}

// Login only asks for a password of the minimum length: an account may be
// older than the registration rules
export function validateLoginPassword(value: string): string | undefined {
  if (value === '') {
    return MESSAGES.passwordRequired;
  }

  return value.length >= PASSWORD_MIN_LENGTH ? undefined : MESSAGES.passwordLength;
}

// A character that cannot be in a password is named first: no other change
// would make the password valid
export function validateRegistrationPassword(value: string): string | undefined {
  if (value === '') {
    return MESSAGES.passwordRequired;
  }
  if (!PASSWORD_CHARACTERS_PATTERN.test(value)) {
    return MESSAGES.passwordCharacters;
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return MESSAGES.passwordLength;
  }
  if (!UPPERCASE_PATTERN.test(value)) {
    return MESSAGES.passwordUppercase;
  }
  if (!DIGIT_PATTERN.test(value)) {
    return MESSAGES.passwordDigit;
  }

  return SPECIAL_PATTERN.test(value) ? undefined : MESSAGES.passwordSpecial;
}

// The confirmation only has to match: the password rules are checked on the
// password itself
export function validateConfirmPassword(value: string, password: string): string | undefined {
  if (value === '') {
    return MESSAGES.confirmPasswordRequired;
  }

  return value === password ? undefined : MESSAGES.confirmPasswordMismatch;
}

// The error of one field of a form, with the other values the rule needs
export function validateAuthField(
  mode: AuthMode,
  name: AuthFieldName,
  values: AuthValues,
): string | undefined {
  const value: string = values[name] ?? '';

  switch (name) {
    case AuthFieldName.Email: {
      return validateEmail(value);
    }
    case AuthFieldName.Username: {
      return validateUsername(value);
    }
    case AuthFieldName.Password: {
      return mode === AuthMode.Register
        ? validateRegistrationPassword(value)
        : validateLoginPassword(value);
    }
    case AuthFieldName.ConfirmPassword: {
      return validateConfirmPassword(value, values[AuthFieldName.Password] ?? '');
    }
  }
}
