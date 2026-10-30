import { describe, expect, it } from 'vitest';
import { getSquareCrop, isImageFile } from './resize-image.ts';

describe('getSquareCrop', (): void => {
  it('cuts the sides of a wide picture', (): void => {
    expect(getSquareCrop(400, 200)).toEqual({ x: 100, y: 0, side: 200 });
  });

  it('cuts the top and bottom of a tall picture', (): void => {
    expect(getSquareCrop(300, 500)).toEqual({ x: 0, y: 100, side: 300 });
  });

  it('keeps a square picture whole', (): void => {
    expect(getSquareCrop(128, 128)).toEqual({ x: 0, y: 0, side: 128 });
  });
});

describe('isImageFile', (): void => {
  it('takes the picture types a browser can draw', (): void => {
    expect(isImageFile(new File([''], 'me.png', { type: 'image/png' }))).toBe(true);
    expect(isImageFile(new File([''], 'me.webp', { type: 'image/webp' }))).toBe(true);
  });

  it('refuses any other file', (): void => {
    expect(isImageFile(new File([''], 'notes.txt', { type: 'text/plain' }))).toBe(false);
    expect(isImageFile(new File([''], 'shape.svg', { type: 'image/svg+xml' }))).toBe(false);
  });
});
