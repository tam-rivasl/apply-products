// src/common/utils/sanitize.ts

/** Colapsa espacios internos a uno y trimea extremos. */
export const collapseSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Quita diacríticos (ñ se mantiene como ñ → se separa en NFD). Úsalo con moderación. */
export const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Devuelve string “limpio” o undefined si no venía o quedó vacío. */
export const cleanString = (v?: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const out = collapseSpaces(v);
  return out.length ? out : undefined;
};

/** Versión que devuelve null cuando queda vacío (útil para columnas NULLable). */
export const cleanStringOrNull = (v?: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const out = collapseSpaces(v);
  return out.length ? out : null;
};

/** Uppercase seguro: usa cleanString y si queda vacío devuelve undefined. */
export const toUpper = (v?: unknown): string | undefined => {
  const s = cleanString(v);
  return s ? s.toUpperCase() : undefined;
};

/** Uppercase que retorna null cuando queda vacío (para columnas NULLable). */
export const toUpperOrNull = (v?: unknown): string | null => {
  const s = cleanString(v);
  return s ? s.toUpperCase() : null;
};

/** Convierte a número (float/decimal) o undefined si no aplica. No castea undefined→null. */
export const toNumberOrUndef = (v?: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  // Permite "12,34" → "12.34" (caso locales)
  const asStr = String(v).replace(',', '.');
  const n = Number(asStr);
  return Number.isFinite(n) ? n : undefined;
};

/** Convierte a número (float/decimal) o null si no aplica (para columnas NULLable). */
export const toNumberOrNull = (v?: unknown): number | null => {
  const n = toNumberOrUndef(v);
  return n === undefined ? null : n;
};

/** Convierte a int o undefined si no aplica. */
export const toIntOrUndef = (v?: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

/** Convierte a int o null si no aplica (para columnas NULLable). */
export const toIntOrNull = (v?: unknown): number | null => {
  const n = toIntOrUndef(v);
  return n === undefined ? null : n;
};

/** Limpia string y quita diacríticos opcionalmente. */
export const cleanAndMaybeStrip = (
  v?: unknown,
  opts?: { strip?: boolean },
): string | undefined => {
  const s = cleanString(v);
  if (!s) return undefined;
  return opts?.strip ? stripDiacritics(s) : s;
};

/** Normaliza una currency (CLP, USD, etc.). Devuelve undefined si no aplica. */
export const normalizeCurrency = (v?: unknown): string | undefined => {
  const up = toUpper(v);
  if (!up) return undefined;
  // Mantén solo A-Z (3–5 chars típico). Ajusta si quieres permitir símbolos.
  const code = up.replace(/[^A-Z]/g, '');
  return code.length ? code : undefined;
};

/** SKU típico: colapsa espacios, uppercase y recorta a 64 chars. */
export const normalizeSku = (v?: unknown): string | undefined => {
  const s = cleanString(v);
  if (!s) return undefined;
  return s.toUpperCase().slice(0, 64);
};

/** Nombre de producto: colapsa, recorta a 200 chars; si queda vacío, null/undefined según preferencia. */
export const normalizeNameOrNull = (v?: unknown): string | null => {
  const s = cleanString(v);
  if (!s) return null;
  return s.slice(0, 200);
};

/** Helpers agrupados (retrocompatibles con tu viejo objeto `sanitize`) */
export const sanitize = {
  str: cleanStringOrNull, // string | null
  strUndef: cleanString, // string | undefined
  up: toUpperOrNull, // string | null
  dec: toNumberOrNull, // number | null
  int: toIntOrNull, // number | null
};
