/** One origin per line; blanks and duplicates are dropped. The API validates and normalizes them. */
export function parseOrigins(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return [...new Set(lines)];
}
