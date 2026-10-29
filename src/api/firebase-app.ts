import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

// Firebase starts once: later calls get the same app
const started: { app?: FirebaseApp } = {};

// The web app config of the Firebase project. Vite reads it from .env.local on
// a developer's machine and from the repository variables in the deploy (see
// .env.example). The config is not a secret: it only names the project, and
// the project's authorized domains and Firestore rules decide what a page may
// do.
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

// The Firebase app that sign-in and Firestore share, so Firestore knows the
// signed-in user
export function getFirebaseApp(): FirebaseApp {
  started.app ??= initializeApp(readFirebaseOptions());

  return started.app;
}
