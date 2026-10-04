// The API's answers arrive as unknown values. These checks prove their shape
// before the app uses them, so a broken answer fails in one place.

export type Guard<T> = (value: unknown) => value is T;

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArrayOf<T>(value: unknown, isItem: Guard<T>): value is readonly T[] {
  return Array.isArray(value) && value.every((item: unknown): boolean => isItem(item));
}
