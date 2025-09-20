import {
  collapseSpaces,
  stripDiacritics,
  cleanString,
  cleanStringOrNull,
  toUpper,
  toUpperOrNull,
  toNumberOrUndef,
  toNumberOrNull,
  toIntOrUndef,
  toIntOrNull,
  cleanAndMaybeStrip,
  normalizeCurrency,
  normalizeSku,
  normalizeNameOrNull,
  sanitize,
} from './sanitize';

describe('sanitize utils', () => {
  it('collapses spaces and strips diacritics', () => {
    expect(collapseSpaces('  hola   mundo  ')).toBe('hola mundo');
    expect(stripDiacritics('Árbol')).toBe('Arbol');
  });

  it('cleans strings returning undefined or null appropriately', () => {
    expect(cleanString('  test  ')).toBe('test');
    expect(cleanString(123 as any)).toBeUndefined();
    expect(cleanStringOrNull('   ')).toBeNull();
  });

  it('uppercases safely', () => {
    expect(toUpper('  abc  ')).toBe('ABC');
    expect(toUpper(undefined)).toBeUndefined();
    expect(toUpperOrNull('  ')).toBeNull();
  });

  it('parses numbers and ints with locale variations', () => {
    expect(toNumberOrUndef('12,30')).toBeCloseTo(12.3);
    expect(toNumberOrUndef('abc')).toBeUndefined();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toIntOrUndef('15')).toBe(15);
    expect(toIntOrUndef('NaN')).toBeUndefined();
    expect(toIntOrNull('')).toBeNull();
  });

  it('cleans with optional diacritic removal', () => {
    expect(cleanAndMaybeStrip('  Árbol  ')).toBe('Árbol');
    expect(cleanAndMaybeStrip('  Árbol  ', { strip: true })).toBe('Arbol');
  });

  it('normalizes domain-specific values', () => {
    expect(normalizeCurrency(' cLp$ ')).toBe('CLP');
    expect(normalizeSku(' sku-123 ')).toBe('SKU-123');
    expect(normalizeNameOrNull('   ')).toBeNull();
    expect(normalizeNameOrNull('Very long '.padEnd(205, 'x'))).toHaveLength(200);
  });

  it('provides legacy sanitize helpers', () => {
    expect(sanitize.str(' value ')).toBe('value');
    expect(sanitize.strUndef(' value ')).toBe('value');
    expect(sanitize.up(' value ')).toBe('VALUE');
    expect(sanitize.dec('3,5')).toBe(3.5);
    expect(sanitize.int('5')).toBe(5);
  });
});
