import { parseOrigins } from './origins';

describe('parseOrigins', () => {
  it('splits lines, trims, drops blanks and duplicates', () => {
    expect(parseOrigins(' https://a.com \n\nhttps://b.com\nhttps://a.com\n')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(parseOrigins('  \n ')).toEqual([]);
  });
});
