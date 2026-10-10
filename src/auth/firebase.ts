import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase starts once: later calls get the same instance
const started: { auth?: Auth } = {};

// The web app config of the Firebase project. Vite reads it from .env.local on
// a developer's machine and from the repository variables in the deploy (see
// .env.example). The config is not a secret: it only names the project, and
// the project's authorized domains decide where sign-in works.
function readFirebaseOptions(): FirebaseOptions {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

// Firebase starts on the first sign-in or sign-out, so a visit that never
// signs in does not start it. Without a config it fails here with
// auth/invalid-api-key, which the auth service turns into a message.
export function getFirebaseAuth(): Auth {
  started.auth ??= getAuth(initializeApp(readFirebaseOptions()));

  return started.auth;
}
