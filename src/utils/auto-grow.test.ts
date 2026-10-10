import { describe, expect, it, vi, type Mock } from 'vitest';
import { fitToText } from './auto-grow.ts';

type Supports = (property: string, value: string) => boolean;

// A browser that knows `field-sizing: content`, or one that does not
function stubSupport(isSupported: boolean): Mock<Supports> {
  const supports: Mock<Supports> = vi.fn<Supports>().mockReturnValue(isSupported);
  vi.stubGlobal('CSS', { supports });

  return supports;
}

// A textarea whose text is 70px tall inside a 1px border on each side
function createTextarea(): HTMLTextAreaElement {
  const textarea: HTMLTextAreaElement = document.createElement('textarea');
  Object.defineProperties(textarea, {
    scrollHeight: { value: 70 },
    offsetHeight: { value: 50 },
    clientHeight: { value: 48 },
  });

  return textarea;
}

describe('fitToText', (): void => {
  it('leaves the height to the styles where the browser sizes the field', (): void => {
    stubSupport(true);
    const textarea: HTMLTextAreaElement = createTextarea();

    fitToText(textarea);

    expect(textarea.style.height).toBe('');
  });

  it('sets the height of the text and the border elsewhere', (): void => {
    const supports: Mock<Supports> = stubSupport(false);
    const textarea: HTMLTextAreaElement = createTextarea();

    fitToText(textarea);

    expect(supports).toHaveBeenCalledWith('field-sizing', 'content');
    expect(textarea.style.height).toBe('72px');
  });
});
