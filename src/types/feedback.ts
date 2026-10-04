// The kinds of snackbar messages. The values are used in class names.
export enum SnackbarVariant {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface SnackbarMessage {
  readonly variant: SnackbarVariant;
  readonly text: string;
}

export interface FeedbackContent {
  readonly retryText: string;
  // A lost connection is reported with the same words by every area, so two
  // areas that fail at once show one snackbar
  readonly networkErrorMessage: string;
  readonly closeMessageLabel: string;
}

// What an area that loads data says when its request fails, and when a retry
// brings the data after all
export interface LoadMessages {
  readonly errorTitle: string;
  readonly successMessage: string;
}
