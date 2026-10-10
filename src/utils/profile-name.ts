import { GENERIC_PROFILE_NAME } from '../data/profile.ts';
import type { AuthProfile } from '../types/auth.ts';

const INITIALS_WORDS = 2;

// The API takes the author name of a comment from 2 to 30 characters long
const AUTHOR_NAME_MIN_LENGTH = 2;
const AUTHOR_NAME_MAX_LENGTH = 30;

// The first letter or digit of a word, in any alphabet
const ALPHANUMERIC_PATTERN: RegExp = /[\p{L}\p{N}]/u;
const WHITESPACE_PATTERN: RegExp = /\s+/u;

// The name the header shows: the profile name, else the part of the email
// before the @, else a generic name
export function getProfileName(profile: AuthProfile): string {
  const name: string = profile.displayName.trim();
  if (name !== '') {
    return name;
  }
  const localPart: string = profile.email.split('@', 1)[0]?.trim() ?? '';

  return localPart === '' ? GENERIC_PROFILE_NAME : localPart;
}

// The initials of an avatar: the first letter or digit of the first word, and
// of the second word when there is one, in uppercase. "Alex Pro" is "AP",
// "cozy" is "C" and "Élodie 9lives" is "É9". A name without letters or digits
// has none, and the avatar shows a generic picture instead.
export function getProfileInitials(name: string): string | undefined {
  const words: string[] = name.trim().split(WHITESPACE_PATTERN).slice(0, INITIALS_WORDS);
  const initials: string = words
    .map((word: string): string => ALPHANUMERIC_PATTERN.exec(word)?.[0] ?? '')
    .join('')
    .toUpperCase();

  return initials === '' ? undefined : initials;
}

// The name a comment is posted under: the shown name when the API takes it,
// else its first 30 characters, else the generic name for a name too short
export function getCommentAuthorName(profile: AuthProfile): string {
  const name: string = getProfileName(profile);
  const shortened: string = name.slice(0, AUTHOR_NAME_MAX_LENGTH).trim();

  return shortened.length < AUTHOR_NAME_MIN_LENGTH ? GENERIC_PROFILE_NAME : shortened;
}

// The letter of a round comment avatar: the first character of the name after
// any spaces, in uppercase. A character such as an emoji stays whole.
export function getNameInitial(name: string): string {
  const [initial = ''] = name.trim();

  return initial.toUpperCase();
}
