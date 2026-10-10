import { describe, expect, it } from 'vitest';
import { GENERIC_PROFILE_NAME } from '../data/profile.ts';
import {
  getCommentAuthorName,
  getNameInitial,
  getProfileInitials,
  getProfileName,
} from './profile-name.ts';

describe('getProfileName', (): void => {
  it('uses the display name without the spaces around it', (): void => {
    expect(getProfileName({ displayName: '  Alex Pro ', email: 'alex@minigames.com' })).toBe(
      'Alex Pro',
    );
  });

  it('falls back to the part of the email before the @', (): void => {
    expect(getProfileName({ displayName: ' ', email: 'cozy.gamer@minigames.com' })).toBe(
      'cozy.gamer',
    );
  });

  it('falls back to a generic name without a usable email', (): void => {
    expect(getProfileName({ displayName: '', email: '@minigames.com' })).toBe(GENERIC_PROFILE_NAME);
    expect(getProfileName({ displayName: '', email: '' })).toBe(GENERIC_PROFILE_NAME);
  });
});

describe('getProfileInitials', (): void => {
  it('takes the first letter of a one-word name in uppercase', (): void => {
    expect(getProfileInitials('cozy')).toBe('C');
    expect(getProfileInitials('CozyGamer99')).toBe('C');
  });

  it('takes the first letters of the first two words', (): void => {
    expect(getProfileInitials('Alex Pro')).toBe('AP');
    expect(getProfileInitials('anna maria  von berg')).toBe('AM');
  });

  it('trims the name and splits it on any whitespace', (): void => {
    expect(getProfileInitials('  alex\tpro\n')).toBe('AP');
  });

  it('skips characters that are neither letters nor digits', (): void => {
    expect(getProfileInitials('_alex (pro)')).toBe('AP');
    expect(getProfileInitials('Alex !!!')).toBe('A');
  });

  it('supports letters and digits of any alphabet', (): void => {
    expect(getProfileInitials('élodie özil')).toBe('ÉÖ');
    expect(getProfileInitials('анна петрова')).toBe('АП');
    expect(getProfileInitials('9lives player')).toBe('9P');
  });

  it('has no initials for a name without letters or digits', (): void => {
    expect(getProfileInitials('')).toBeUndefined();
    expect(getProfileInitials('  ')).toBeUndefined();
    expect(getProfileInitials('!! __')).toBeUndefined();
  });
});

describe('getCommentAuthorName', (): void => {
  it('posts under the shown name when the API takes it', (): void => {
    expect(getCommentAuthorName({ displayName: ' Alex Pro ', email: 'alex@minigames.com' })).toBe(
      'Alex Pro',
    );
    expect(getCommentAuthorName({ displayName: '', email: 'cozy.gamer@minigames.com' })).toBe(
      'cozy.gamer',
    );
  });

  it('cuts a name longer than 30 characters', (): void => {
    const name: string = getCommentAuthorName({
      displayName: 'Alexandra Montgomery-Fitzgerald the Third',
      email: 'alex@minigames.com',
    });

    expect(name).toBe('Alexandra Montgomery-Fitzgeral');
    expect(name).toHaveLength(30);
  });

  it('uses the generic name for a name shorter than 2 characters', (): void => {
    expect(getCommentAuthorName({ displayName: 'A', email: 'a@minigames.com' })).toBe(
      GENERIC_PROFILE_NAME,
    );
  });
});

describe('getNameInitial', (): void => {
  it('takes the first character after the spaces, in uppercase', (): void => {
    expect(getNameInitial('  forestDweller')).toBe('F');
    expect(getNameInitial('élodie')).toBe('É');
    expect(getNameInitial('9lives')).toBe('9');
  });

  it('keeps a character outside the basic plane whole', (): void => {
    expect(getNameInitial('🦊 Fox')).toBe('🦊');
  });

  it('is empty for an empty name', (): void => {
    expect(getNameInitial(' '.repeat(3))).toBe('');
  });
});
