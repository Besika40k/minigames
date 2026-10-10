import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError, ApiErrorKind } from '../../api/api-error.ts';
import { FEEDBACK_CONTENT } from '../../data/feedback.ts';
import { SnackbarVariant, type LoadMessages } from '../../types/feedback.ts';
import { showSnackbar } from '../snackbar/snackbar.ts';
import { createAsyncArea, type AsyncArea } from './async-area.ts';

vi.mock('../snackbar/snackbar.ts', () => ({ showSnackbar: vi.fn() }));

const MESSAGES: LoadMessages = {
  errorTitle: "Couldn't load the games",
  successMessage: 'The games are loaded',
};

type Load = Mock<(signal: AbortSignal) => Promise<readonly string[]>>;

interface TestArea {
  readonly area: AsyncArea;
  readonly container: HTMLElement;
  readonly onLoad: Mock<(data: readonly string[]) => void>;
  readonly onError: Mock<(error: unknown) => void>;
}

function paragraph(text: string): HTMLParagraphElement {
  const element: HTMLParagraphElement = document.createElement('p');
  element.textContent = text;

  return element;
}

// An area that lists names, with "loading" and "none" as its skeleton and
// empty placeholder
function renderArea(load: Load, hasNotFound: boolean = false): TestArea {
  const container: HTMLElement = document.createElement('section');
  const onLoad: Mock<(data: readonly string[]) => void> =
    vi.fn<(data: readonly string[]) => void>();
  const onError: Mock<(error: unknown) => void> = vi.fn<(error: unknown) => void>();
  const area: AsyncArea = createAsyncArea<readonly string[]>({
    container,
    messages: MESSAGES,
    load,
    renderSkeleton: (): readonly Node[] => [paragraph('loading')],
    renderData: (names: readonly string[]): readonly Node[] =>
      names.map((name: string): HTMLParagraphElement => paragraph(name)),
    isEmpty: (names: readonly string[]): boolean => names.length === 0,
    renderEmpty: (): readonly Node[] => [paragraph('none')],
    ...(hasNotFound && { renderNotFound: (): readonly Node[] => [paragraph('not found')] }),
    onLoad,
    onError,
  });

  return { area, container, onLoad, onError };
}

function createLoad(): Load {
  return vi.fn<(signal: AbortSignal) => Promise<readonly string[]>>();
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, milliseconds);
  });
}

beforeEach((): void => {
  vi.clearAllMocks();
});

describe('async area', (): void => {
  it('shows the skeleton while the request is on its way, then the data', async (): Promise<void> => {
    const { area, container, onLoad } = renderArea(createLoad().mockResolvedValue(['Chess', 'Go']));

    area.reload();
    expect(container.textContent).toBe('loading');
    expect(container.getAttribute('aria-busy')).toBe('true');

    await wait(0);

    expect(container.textContent).toBe('ChessGo');
    expect(container.hasAttribute('aria-busy')).toBe(false);
    expect(onLoad).toHaveBeenCalledExactlyOnceWith(['Chess', 'Go']);
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('shows the placeholder for an answer without items', async (): Promise<void> => {
    const { area, container } = renderArea(createLoad().mockResolvedValue([]));

    area.reload();
    await wait(0);

    expect(container.textContent).toBe('none');
  });

  it('shows an error banner that loads again with Retry, and says when it worked', async (): Promise<void> => {
    const load: Load = createLoad()
      .mockRejectedValueOnce(new ApiError(ApiErrorKind.Server, 'The server is down.', 500))
      .mockResolvedValueOnce(['Chess']);
    const { area, container, onError } = renderArea(load);

    area.reload();
    await wait(0);

    expect(container.querySelector('.error-banner__title')?.textContent).toBe(MESSAGES.errorTitle);
    expect(container.querySelector('.error-banner__message')?.textContent).toBe(
      'The server is down.',
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenLastCalledWith({
      variant: SnackbarVariant.Error,
      text: MESSAGES.errorTitle,
    });

    container.querySelector<HTMLButtonElement>(':scope .error-banner__retry')?.click();
    await wait(0);

    expect(container.textContent).toBe('Chess');
    expect(showSnackbar).toHaveBeenLastCalledWith({
      variant: SnackbarVariant.Success,
      text: MESSAGES.successMessage,
    });
  });

  it('names a lost connection and warns about a rate limit with the time to wait', async (): Promise<void> => {
    const load: Load = createLoad()
      .mockRejectedValueOnce(new ApiError(ApiErrorKind.Network, 'No answer.'))
      .mockRejectedValueOnce(
        new ApiError(ApiErrorKind.RateLimit, 'Rate limit exceeded. Try again in 42 seconds', 429),
      );
    const { area } = renderArea(load);

    area.reload();
    await wait(0);
    area.reload();
    await wait(0);

    expect(vi.mocked(showSnackbar).mock.calls).toEqual([
      [{ variant: SnackbarVariant.Error, text: FEEDBACK_CONTENT.networkErrorMessage }],
      [{ variant: SnackbarVariant.Warning, text: 'Rate limit exceeded. Try again in 42 seconds' }],
    ]);
  });

  it('describes a failure that is not an API error in general words', async (): Promise<void> => {
    const { area, container } = renderArea(createLoad().mockRejectedValue(new TypeError('bug')));

    area.reload();
    await wait(0);

    expect(container.querySelector('.error-banner__message')?.textContent).toBe(
      'Something unexpected went wrong.',
    );
  });

  it('shows its own state for a 404 when it has one', async (): Promise<void> => {
    const load: Load = createLoad().mockRejectedValue(
      new ApiError(ApiErrorKind.NotFound, 'Game not found: chess', 404),
    );
    const { area, container, onError } = renderArea(load, true);

    area.reload();
    await wait(0);

    expect(container.textContent).toBe('not found');
    expect(onError).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      variant: SnackbarVariant.Warning,
      text: 'Game not found: chess',
    });
  });

  it('draws only the answer of the latest request', async (): Promise<void> => {
    const signals: AbortSignal[] = [];
    const load: Load = createLoad().mockImplementation(
      async (signal: AbortSignal): Promise<readonly string[]> => {
        signals.push(signal);
        const isFirst: boolean = signals.length === 1;
        // The first request answers last
        await wait(isFirst ? 20 : 0);

        return [isFirst ? 'Old' : 'New'];
      },
    );
    const { area, container, onLoad } = renderArea(load);

    area.reload();
    area.reload();
    await wait(40);

    expect(signals[0]?.aborted).toBe(true);
    expect(container.textContent).toBe('New');
    expect(onLoad).toHaveBeenCalledExactlyOnceWith(['New']);
  });

  it('draws nothing more once it is canceled', async (): Promise<void> => {
    const load: Load = createLoad().mockImplementation(
      async (signal: AbortSignal): Promise<readonly string[]> =>
        new Promise<readonly string[]>((_resolve: unknown, reject: (reason: unknown) => void) => {
          signal.addEventListener('abort', (): void => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const { area, container, onError } = renderArea(load);

    area.reload();
    area.abort();
    await wait(0);

    expect(container.textContent).toBe('loading');
    expect(onError).not.toHaveBeenCalled();
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
