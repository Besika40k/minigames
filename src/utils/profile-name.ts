import { GENERIC_PROFILE_NAME } from '../data/profile.ts';
import type { AuthProfile } from '../types/auth.ts';

const INITIALS_WORDS = 2;

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
