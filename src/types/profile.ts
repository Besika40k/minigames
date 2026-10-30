import type { ChangeMessages, LoadMessages } from './feedback.ts';

// What a user tells about themselves on the profile page, kept in Firestore.
// The photo is a small picture written into the text of a data: address.
export interface UserProfile {
  readonly bio: string;
  readonly photo?: string;
}

// What the picture buttons say after a change
export interface PictureMessages extends ChangeMessages {
  readonly saved: string;
  readonly removed: string;
  readonly notImage: string;
  readonly tooLarge: string;
  readonly unreadable: string;
}

// What the bio form says after a save
export interface BioMessages extends ChangeMessages {
  readonly saved: string;
  readonly tooLong: string;
}

export interface ProfileContent {
  readonly title: string;
  // The page of a guest, with a way to log in
  readonly guestTitle: string;
  readonly guestMessage: string;
  readonly loginText: string;
  readonly profileMessages: LoadMessages;
  readonly changePictureText: string;
  readonly removePictureText: string;
  readonly pictureMessages: PictureMessages;
  readonly bioTitle: string;
  readonly bioLabel: string;
  readonly bioPlaceholder: string;
  // The bio of a user who has written none yet
  readonly emptyBioText: string;
  readonly editBioText: string;
  readonly saveBioText: string;
  readonly cancelText: string;
  readonly bioMessages: BioMessages;
  readonly favoritesTitle: string;
  readonly favoritesMessages: LoadMessages;
  readonly noFavoritesTitle: string;
  readonly noFavoritesMessage: string;
  readonly libraryLinkText: string;
  readonly recordsTitle: string;
  readonly noRecordsTitle: string;
  readonly noRecordsMessage: string;
  readonly playText: string;
}
