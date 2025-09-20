// Utility helpers for normalising user-provided strings and numbers.

/** Collapse internal whitespace and trim the ends of a string. */
export const collapseSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Remove diacritics from a string while keeping the base characters. */
export const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Return a cleaned string or undefined if the result is empty. */
export const cleanString = (v?: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const out = collapseSpaces(v);
  return out.length ? out : undefined;
};

/** Same as cleanString but returns null when the result is empty. */
export const cleanStringOrNull = (v?: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const out = collapseSpaces(v);
  return out.length ? out : null;
};

/** Uppercase helper that returns undefined if the string is empty. */
export const toUpper = (v?: unknown): string | undefined => {
  const s = cleanString(v);
  return s ? s.toUpperCase() : undefined;
};

/** Uppercase helper that returns null when the string is empty. */
export const toUpperOrNull = (v?: unknown): string | null => {
  const s = cleanString(v);
  return s ? s.toUpperCase() : null;
};

/** Convert to number (float/decimal) or undefined when conversion fails. */
export const toNumberOrUndef = (v?: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const asStr = String(v).replace(',', '.');
  const n = Number(asStr);
  return Number.isFinite(n) ? n : undefined;
};

/** Convert to number or null when conversion fails (nullable columns). */
export const toNumberOrNull = (v?: unknown): number | null => {
  const n = toNumberOrUndef(v);
  return n === undefined ? null : n;
};

/** Convert to integer or undefined when conversion fails. */
export const toIntOrUndef = (v?: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

/** Convert to integer or null when conversion fails (nullable columns). */
export const toIntOrNull = (v?: unknown): number | null => {
  const n = toIntOrUndef(v);
  return n === undefined ? null : n;
};

/** Clean a string and optionally remove diacritics. */
export const cleanAndMaybeStrip = (
  v?: unknown,
  opts?: { strip?: boolean },
): string | undefined => {
  const s = cleanString(v);
  if (!s) return undefined;
  return opts?.strip ? stripDiacritics(s) : s;
};

/** Normalise currency codes (e.g. CLP, USD). */
export const normalizeCurrency = (v?: unknown): string | undefined => {
  const up = toUpper(v);
  if (!up) return undefined;
  const code = up.replace(/[^A-Z]/g, '');
  return code.length ? code : undefined;
};

/** Normalise SKU: collapse spaces, uppercase and trim to 64 characters. */
export const normalizeSku = (v?: unknown): string | undefined => {
  const s = cleanString(v);
  if (!s) return undefined;
  return s.toUpperCase().slice(0, 64);
};

/** Normalise product name: collapse spaces, limit to 200 characters. */
export const normalizeNameOrNull = (v?: unknown): string | null => {
  const s = cleanString(v);
  if (!s) return null;
  return s.slice(0, 200);
};

/** Export grouped helpers for backwards compatibility. */
export const sanitize = {
  str: cleanStringOrNull,
  strUndef: cleanString,
  up: toUpperOrNull,
  dec: toNumberOrNull,
  int: toIntOrNull,
};
