import { ApiError, ApiErrorKind } from '../../api/api-error.ts';
import { FEEDBACK_CONTENT } from '../../data/feedback.ts';
import { SnackbarVariant, type LoadMessages } from '../../types/feedback.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';
import { createErrorBanner } from './error-banner.ts';

export interface AsyncAreaOptions<T> {
  // The element whose content follows the request
  readonly container: HTMLElement;
  readonly messages: LoadMessages;
  readonly load: (signal: AbortSignal) => Promise<T>;
  readonly renderSkeleton: () => readonly Node[];
  readonly renderData: (data: T) => readonly Node[];
  // An answer without items gets a placeholder of its own
  readonly isEmpty: (data: T) => boolean;
  readonly renderEmpty: (data: T) => readonly Node[];
}

export interface AsyncArea {
  // Sends the request, cancelling one that is still on its way
  readonly reload: () => void;
  // Cancels the request, for example when the page closes
  readonly abort: () => void;
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something unexpected went wrong.';
}

// A snackbar sums the failure up. A lost connection reads the same in every
// area, so it is shown once; a rate limit is a warning with the time to wait.
function notifyFailure(error: unknown, messages: LoadMessages): void {
  const kind: ApiErrorKind | undefined = error instanceof ApiError ? error.kind : undefined;
  if (kind === ApiErrorKind.RateLimit) {
    showSnackbar({ variant: SnackbarVariant.Warning, text: describeError(error) });
    return;
  }

  const text: string =
    kind === ApiErrorKind.Network ? FEEDBACK_CONTENT.networkErrorMessage : messages.errorTitle;
  showSnackbar({ variant: SnackbarVariant.Error, text });
}

// An area of a page that shows the answer of a request: a skeleton while it
// loads, then the data, a placeholder for an empty answer, or an error banner
// with a Retry button. Only the latest request may draw, so an older answer
// that arrives late never replaces a newer one.
export function createAsyncArea<T>(options: AsyncAreaOptions<T>): AsyncArea {
  let controller: AbortController | undefined;

  const show = (nodes: readonly Node[]): void => {
    options.container.replaceChildren(...nodes);
  };

  const run = async (isRetry: boolean): Promise<void> => {
    controller?.abort();
    const current: AbortController = new AbortController();
    controller = current;

    options.container.setAttribute('aria-busy', 'true');
    show(options.renderSkeleton());
    try {
      const data: T = await options.load(current.signal);
      if (current.signal.aborted) {
        return;
      }
      show(options.isEmpty(data) ? options.renderEmpty(data) : options.renderData(data));
      if (isRetry) {
        showSnackbar({ variant: SnackbarVariant.Success, text: options.messages.successMessage });
      }
    } catch (error: unknown) {
      // A cancelled request belongs to a page or a query that is gone
      if (current.signal.aborted) {
        return;
      }
      const banner: HTMLElement = createErrorBanner({
        title: options.messages.errorTitle,
        message: describeError(error),
        onRetry: (): void => {
          void run(true);
        },
      });
      show([banner]);
      notifyFailure(error, options.messages);
    } finally {
      if (!current.signal.aborted) {
        options.container.removeAttribute('aria-busy');
      }
    }
  };

  return {
    reload: (): void => {
      void run(false);
    },
    abort: (): void => {
      controller?.abort();
    },
  };
}
