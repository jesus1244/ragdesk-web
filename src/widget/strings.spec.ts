import { strings } from './strings';

describe('strings', () => {
  it('picks the language from a plain or regional code', () => {
    expect(strings('es').send).toBe('Enviar');
    expect(strings('es-CO').send).toBe('Enviar');
    expect(strings('EN-us').send).toBe('Send');
  });

  it('falls back to English for missing or unknown languages', () => {
    expect(strings(undefined).send).toBe('Send');
    expect(strings('').send).toBe('Send');
    expect(strings('fr').send).toBe('Send');
  });

  it('has the same keys in every language', () => {
    expect(Object.keys(strings('es')).sort()).toEqual(Object.keys(strings('en')).sort());
  });
});
