// One item of a list, chosen at random; undefined for an empty list
export function pickRandom<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}
