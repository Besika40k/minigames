import { FEEDBACK_CONTENT } from '../../data/feedback.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { createButton } from '../button/button.ts';
import './error-banner.scss';

export interface ErrorBannerOptions {
  // What could not load
  readonly title: string;
  // Why, in the server's words when it said anything
  readonly message: string;
  // Sends the same request again
  readonly onRetry: () => void;
}

// Takes the place of an area whose data could not load
export function createErrorBanner(options: ErrorBannerOptions): HTMLElement {
  const retryButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Small,
    className: 'error-banner__retry',
    children: [createIcon(IconName.Refresh), document.createTextNode(FEEDBACK_CONTENT.retryText)],
    onClick: options.onRetry,
  });

  const text: HTMLDivElement = createElement('div', {
    className: 'error-banner__text',
    children: [
      createElement('p', { className: 'error-banner__title', text: options.title }),
      createElement('p', { className: 'error-banner__message', text: options.message }),
    ],
  });

  return createElement('div', {
    className: 'error-banner',
    attributes: { role: 'alert' },
    children: [createIcon(IconName.Error), text, retryButton],
  });
}
