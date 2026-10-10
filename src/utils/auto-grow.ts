// Fits a textarea to its text. Browsers that know `field-sizing: content` do it
// from the styles; in the others the height follows the text, up to the
// max-height of the styles, after which the textarea scrolls. Call it after
// every change of the text, also one made from code.
export function fitToText(textarea: HTMLTextAreaElement): void {
  if (CSS.supports('field-sizing', 'content')) {
    return;
  }
  textarea.style.height = 'auto';
  // scrollHeight leaves out the border, which offsetHeight counts
  const border: number = textarea.offsetHeight - textarea.clientHeight;
  textarea.style.height = `${String(textarea.scrollHeight + border)}px`;
}
