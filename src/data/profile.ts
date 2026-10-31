import type { ProfileContent } from '../types/profile.ts';

// The name of a signed-in user whose profile has neither a name nor an email
export const GENERIC_PROFILE_NAME = 'Player';

// The longest bio the rules of the database take (see firestore.rules)
export const BIO_MAX_LENGTH = 300;

// The profile picture is a square of this many pixels, small enough to keep
// in the profile itself (Firestore takes a document of up to 1 MB)
export const PHOTO_SIZE = 128;

// A picture larger than this is refused before it is read
export const PHOTO_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const PROFILE_CONTENT: ProfileContent = {
  title: 'My Profile',
  guestTitle: 'Log in to see your profile',
  guestMessage: 'Your picture, your bio and your favorite games live here.',
  loginText: 'Log In',
  profileMessages: {
    errorTitle: "Couldn't load your profile",
    successMessage: 'Your profile is loaded',
  },
  changePictureText: 'Change picture',
  removePictureText: 'Remove picture',
  pictureMessages: {
    loginWarning: 'Log in to change your picture.',
    unconfirmed: "The change wasn't confirmed, so your profile is loaded again.",
    saved: 'Your picture is saved.',
    removed: 'Your picture is removed.',
    notImage: 'Choose a picture: a JPEG, PNG, WebP or GIF file.',
    tooLarge: 'This picture is too large. Choose one under 10 MB.',
    unreadable: "This picture couldn't be read. Try another one.",
  },
  bioTitle: 'About me',
  bioLabel: 'Your bio',
  bioPlaceholder: 'Tell other players about yourself...',
  emptyBioText: 'No bio yet.',
  editBioText: 'Edit bio',
  saveBioText: 'Save',
  cancelText: 'Cancel',
  bioMessages: {
    loginWarning: 'Log in to change your bio.',
    unconfirmed: "The change wasn't confirmed, so your profile is loaded again.",
    saved: 'Your bio is saved.',
    tooLong: `A bio can have at most ${String(BIO_MAX_LENGTH)} characters.`,
  },
  favoritesTitle: 'Favorite Games',
  favoritesMessages: {
    errorTitle: "Couldn't load your favorite games",
    successMessage: 'Your favorite games are loaded',
  },
  noFavoritesTitle: 'No favorite games yet',
  noFavoritesMessage: 'Add a game to your favorites from its details, and it shows up here.',
  libraryLinkText: 'Browse Library',
  recordsTitle: 'My Records',
  recordsMessages: {
    errorTitle: "Couldn't load your records",
    successMessage: 'Your records are loaded',
  },
  noRecordsTitle: 'No records yet',
  noRecordsMessage: "Play Alchemist's Cauldron to set your first record.",
  playText: "Play Alchemist's Cauldron",
};
