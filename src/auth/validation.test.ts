import { describe, expect, it } from 'vitest';
import { AUTH_VALIDATION_MESSAGES as MESSAGES } from '../data/auth.ts';
import { AuthFieldName, AuthMode } from '../types/auth.ts';
import {
  validateAuthField,
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegistrationPassword,
  validateUsername,
} from './validation.ts';

describe('validateEmail', (): void => {
  it('accepts standard addresses', (): void => {
    for (const email of [
      'alex@minigames.com',
      'alex.pro+games@mail.mini-games.co.uk',
      'a_1@b.io',
    ]) {
      expect(validateEmail(email)).toBeUndefined();
    }
  });

  it('ignores spaces around the address', (): void => {
    expect(validateEmail('  alex@minigames.com ')).toBeUndefined();
  });

  it('asks for an address when the field is empty or blank', (): void => {
    expect(validateEmail('')).toBe(MESSAGES.emailRequired);
    expect(validateEmail(' '.repeat(3))).toBe(MESSAGES.emailRequired);
  });

  it('rejects addresses without the standard parts', (): void => {
    const invalid: readonly string[] = [
      'alex',
      'alex@',
      '@minigames.com',
      'alex@invalid',
      'alex@minigames.c',
      'alex minigames@mail.com',
      'alex@@minigames.com',
      '.alex@minigames.com',
      'alex..pro@minigames.com',
      'alex@-minigames.com',
      'alex@minigames..com',
    ];

    for (const email of invalid) {
      expect(validateEmail(email), email).toBe(MESSAGES.emailFormat);
    }
  });
});

describe('validateUsername', (): void => {
  it('accepts names from 2 to 30 letters and digits that start with a capital', (): void => {
    expect(validateUsername('Al')).toBeUndefined();
    expect(validateUsername('CozyGamer99')).toBeUndefined();
    expect(validateUsername(`A${'b'.repeat(29)}`)).toBeUndefined();
  });

  it('asks for a name when the field is empty', (): void => {
    expect(validateUsername('')).toBe(MESSAGES.usernameRequired);
  });

  it('needs an uppercase English letter first', (): void => {
    expect(validateUsername('cozyGamer')).toBe(MESSAGES.usernameFirstLetter);
    expect(validateUsername('9Lives')).toBe(MESSAGES.usernameFirstLetter);
    expect(validateUsername('Émile')).toBe(MESSAGES.usernameFirstLetter);
  });

  it('allows only English letters and digits', (): void => {
    expect(validateUsername('Cozy_Gamer')).toBe(MESSAGES.usernameCharacters);
    expect(validateUsername('Cozy Gamer')).toBe(MESSAGES.usernameCharacters);
    expect(validateUsername('Andrés')).toBe(MESSAGES.usernameCharacters);
  });

  it('rejects names shorter than 2 or longer than 30 characters', (): void => {
    expect(validateUsername('A')).toBe(MESSAGES.usernameLength);
    expect(validateUsername(`A${'b'.repeat(30)}`)).toBe(MESSAGES.usernameLength);
  });
});

describe('validateLoginPassword', (): void => {
  it('accepts any password of at least 6 characters', (): void => {
    expect(validateLoginPassword('simple')).toBeUndefined();
    expect(validateLoginPassword('with spaces and ü')).toBeUndefined();
  });

  it('asks for a password and rejects a shorter one', (): void => {
    expect(validateLoginPassword('')).toBe(MESSAGES.passwordRequired);
    expect(validateLoginPassword('Ab1!x')).toBe(MESSAGES.passwordLength);
  });
});

describe('validateRegistrationPassword', (): void => {
  it('accepts a password with an uppercase letter, a digit and a special character', (): void => {
    expect(validateRegistrationPassword('Secret1!')).toBeUndefined();
    expect(validateRegistrationPassword('A1~aaa')).toBeUndefined();
  });

  it('asks for a password when the field is empty', (): void => {
    expect(validateRegistrationPassword('')).toBe(MESSAGES.passwordRequired);
  });

  it('rejects spaces and letters of other alphabets first', (): void => {
    expect(validateRegistrationPassword('Sec ret1!')).toBe(MESSAGES.passwordCharacters);
    expect(validateRegistrationPassword('Пароль1!')).toBe(MESSAGES.passwordCharacters);
    expect(validateRegistrationPassword('ü')).toBe(MESSAGES.passwordCharacters);
  });

  it('needs at least 6 characters', (): void => {
    expect(validateRegistrationPassword('Ab1!x')).toBe(MESSAGES.passwordLength);
  });

  it('names the missing kind of character', (): void => {
    expect(validateRegistrationPassword('secret1!')).toBe(MESSAGES.passwordUppercase);
    expect(validateRegistrationPassword('Secret!!')).toBe(MESSAGES.passwordDigit);
    expect(validateRegistrationPassword('Secret11')).toBe(MESSAGES.passwordSpecial);
  });
});

describe('validateConfirmPassword', (): void => {
  it('accepts an exact copy of the password', (): void => {
    expect(validateConfirmPassword('Secret1!', 'Secret1!')).toBeUndefined();
  });

  it('asks to repeat the password and rejects a different one', (): void => {
    expect(validateConfirmPassword('', 'Secret1!')).toBe(MESSAGES.confirmPasswordRequired);
    expect(validateConfirmPassword('secret1!', 'Secret1!')).toBe(MESSAGES.confirmPasswordMismatch);
  });

  it('checks only the match, not the password rules', (): void => {
    expect(validateConfirmPassword('abc', 'abc')).toBeUndefined();
  });
});

describe('validateAuthField', (): void => {
  it('applies the rules of the form the field belongs to', (): void => {
    const values: { password: string } = { password: 'simple' };

    expect(validateAuthField(AuthMode.Login, AuthFieldName.Password, values)).toBeUndefined();
    expect(validateAuthField(AuthMode.Register, AuthFieldName.Password, values)).toBe(
      MESSAGES.passwordUppercase,
    );
  });

  it('compares the confirmation with the password of the same form', (): void => {
    expect(
      validateAuthField(AuthMode.Register, AuthFieldName.ConfirmPassword, {
        [AuthFieldName.Password]: 'Secret1!',
        [AuthFieldName.ConfirmPassword]: 'Secret1?',
      }),
    ).toBe(MESSAGES.confirmPasswordMismatch);
  });

  it('checks the email and the username', (): void => {
    expect(validateAuthField(AuthMode.Login, AuthFieldName.Email, { email: 'x@y' })).toBe(
      MESSAGES.emailFormat,
    );
    expect(validateAuthField(AuthMode.Register, AuthFieldName.Username, {})).toBe(
      MESSAGES.usernameRequired,
    );
  });
});
