// The texts of the failures of Firestore, by the kind of ApiError they become
export interface FirestoreErrorMessages {
  readonly signedOut: string;
  readonly refused: string;
  readonly rateLimit: string;
  readonly notFound: string;
  readonly network: string;
  readonly failed: string;
  readonly invalidData: string;
}
