// Uniform random integer in [1, max] using crypto with rejection sampling (no modulo bias).
export function randomInt(max: number): number {
  const range = 2 ** 32;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return (buffer[0] % max) + 1;
}

// `count` distinct numbers in [1, max], sorted ascending.
export function drawDistinct(count: number, max: number): number[] {
  const picked = new Set<number>();
  while (picked.size < count) {
    picked.add(randomInt(max));
  }
  return [...picked].sort((a, b) => a - b);
}
