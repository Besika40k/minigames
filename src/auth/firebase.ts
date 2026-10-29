import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseApp } from '../api/firebase-app.ts';

// Firebase Authentication starts once: later calls get the same instance
const started: { auth?: Auth } = {};

// Firebase starts on the first sign-in or sign-out, so a visit that never
// signs in does not start it. Without a config it fails here with
// auth/invalid-api-key, which the auth service turns into a message.
export function getFirebaseAuth(): Auth {
  started.auth ??= getAuth(getFirebaseApp());

  return started.auth;
}
