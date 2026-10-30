// A square cut from the middle of a picture
export interface SquareCrop {
  readonly x: number;
  readonly y: number;
  readonly side: number;
}

// The pictures a profile takes, as the browser names their types
const IMAGE_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// WebP keeps a small picture smallest; a browser that cannot write it makes
// a JPEG instead. Both at this quality look the same at the avatar's size.
const PREFERRED_TYPE = 'image/webp';
const FALLBACK_TYPE = 'image/jpeg';
const OUTPUT_QUALITY = 0.85;

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.has(file.type);
}

// The largest square in the middle of a picture: a wide one loses its sides,
// a tall one its top and bottom
export function getSquareCrop(width: number, height: number): SquareCrop {
  const side: number = Math.min(width, height);

  return { x: (width - side) / 2, y: (height - side) / 2, side };
}

// The picture of a file as a square of `size` pixels, cut from its middle,
// in the text of a data: address. It fails for a file the browser cannot read
// as a picture.
export async function resizeToSquare(file: File, size: number): Promise<string> {
  const bitmap: ImageBitmap = await createImageBitmap(file);
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (context === null) {
    bitmap.close();
    throw new Error('The browser cannot draw the picture.');
  }
  const crop: SquareCrop = getSquareCrop(bitmap.width, bitmap.height);
  context.drawImage(bitmap, crop.x, crop.y, crop.side, crop.side, 0, 0, size, size);
  bitmap.close();

  // A browser answers with a PNG for a type it cannot write
  const preferred: string = canvas.toDataURL(PREFERRED_TYPE, OUTPUT_QUALITY);

  return preferred.startsWith(`data:${PREFERRED_TYPE};`)
    ? preferred
    : canvas.toDataURL(FALLBACK_TYPE, OUTPUT_QUALITY);
}
