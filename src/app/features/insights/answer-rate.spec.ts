import { formatRate } from './answer-rate';

describe('formatRate', () => {
  it('rounds to a whole percentage', () => {
    expect(formatRate(0.333, 3)).toBe('33%');
    expect(formatRate(1, 4)).toBe('100%');
  });

  it('shows a dash before any question', () => {
    expect(formatRate(0, 0)).toBe('–');
  });
});
