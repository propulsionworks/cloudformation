/**
 * Sort predicate for sorting by string in byte order.
 */
export function asciiCompare(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a < b) {
    return -1;
  }
  return 1;
}
