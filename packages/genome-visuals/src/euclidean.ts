/**
 * Bjorklund / Euclidean rhythm: k pulses distributed over n steps.
 * Returns sorted step indices in [0, n).
 */
export function euclideanPattern(k: number, n: number): number[] {
  if (n <= 0) return [];
  const pulses = Math.max(0, Math.min(Math.floor(k), n));
  if (pulses === 0) return [];
  if (pulses === n) return Array.from({ length: n }, (_, i) => i);

  const pattern: number[] = [];
  let bucket = 0;
  for (let i = 0; i < n; i++) {
    bucket += pulses;
    if (bucket >= n) {
      bucket -= n;
      pattern.push(i);
    }
  }
  return pattern;
}
