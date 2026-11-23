/** 0.333 -> "33%". With no questions yet there is nothing to measure. */
export function formatRate(rate: number, questions: number): string {
  return questions === 0 ? '–' : `${Math.round(rate * 100)}%`;
}
