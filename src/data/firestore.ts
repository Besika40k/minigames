import type { FirestoreErrorMessages } from '../types/firestore.ts';

// What a failure of Firestore says, as the snackbars and error banners show it
export const FIRESTORE_ERROR_MESSAGES: FirestoreErrorMessages = {
  signedOut: 'Your sign-in has ended. Log in again and try once more.',
  refused: "This wasn't allowed. If you are signed in, log in again and try once more.",
  rateLimit: 'Too many changes in a short time. Wait a moment and try again.',
  notFound: 'There is no such game.',
  network: 'The data could not be reached.',
  failed: 'The data failed to load.',
  invalidData: 'The data has an unexpected shape.',
};
