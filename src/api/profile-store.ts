import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentReference,
  type DocumentSnapshot,
} from 'firebase/firestore/lite';
import type { UserProfile } from '../types/profile.ts';
import { getDatabase, requireUserId, run } from './firestore.ts';
import { isRecord, isString } from './guards.ts';

// The profile of the signed-in user in Firestore, with the rules that guard
// it (firestore.rules): only that user may read or write it.
//
//   users/{userId}      { bio, photo, updatedAt }
//
// A user without a picture has an empty photo.

const USERS = 'users';

function getProfileDocument(userId: string): DocumentReference {
  return doc(getDatabase(), USERS, userId);
}

// The profile of a document, or an empty one for a user who has saved none
function toProfile(snapshot: DocumentSnapshot): UserProfile {
  const data: unknown = snapshot.data();
  const { bio, photo } = isRecord(data) ? data : {};
  const profile: UserProfile = { bio: isString(bio) ? bio : '' };

  return photo !== '' && isString(photo) ? { ...profile, photo } : profile;
}

export async function fetchUserProfile(userEmail: string): Promise<UserProfile> {
  return run(async (): Promise<UserProfile> => {
    const userId: string = await requireUserId(userEmail);
    const snapshot: DocumentSnapshot = await getDoc(getProfileDocument(userId));

    return toProfile(snapshot);
  });
}

// Writes the whole profile, with the server's time
export async function saveUserProfile(userEmail: string, profile: UserProfile): Promise<void> {
  await run(async (): Promise<void> => {
    const userId: string = await requireUserId(userEmail);
    await setDoc(getProfileDocument(userId), {
      bio: profile.bio,
      photo: profile.photo ?? '',
      updatedAt: serverTimestamp(),
    });
  });
}
