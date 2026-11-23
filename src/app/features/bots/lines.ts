/** One entry per line; blanks and duplicates are dropped. The API validates the entries. */
export function parseLines(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return [...new Set(lines)];
}
