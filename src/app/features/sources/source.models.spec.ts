import { shouldPoll } from './source.models';

describe('shouldPoll', () => {
  it('polls while any source is pending or processing', () => {
    expect(shouldPoll([{ status: 'ready' }, { status: 'processing' }])).toBe(true);
    expect(shouldPoll([{ status: 'pending' }])).toBe(true);
  });

  it('stops when everything is ready or failed', () => {
    expect(shouldPoll([{ status: 'ready' }, { status: 'failed' }])).toBe(false);
    expect(shouldPoll([])).toBe(false);
  });
});
