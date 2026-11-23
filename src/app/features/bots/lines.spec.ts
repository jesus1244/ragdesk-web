import { parseLines } from './lines';

describe('parseLines', () => {
  it('trims, drops blanks and removes duplicates keeping the order', () => {
    expect(parseLines('  Hi?  \n\n Bye?\nHi?\n   ')).toEqual(['Hi?', 'Bye?']);
  });

  it('returns an empty list for empty text', () => {
    expect(parseLines('')).toEqual([]);
  });
});
