// Redacta claves sensibles y serializa de forma segura para logs.

const REDACT_KEYS = [
  'password',
  'pass',
  'pwd',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'client_secret',
  'api_key',
  'apiKey',
  'x-api-key',
  'xApiKey',
];

const MAX_STRING_LENGTH = 2_000; // evita logs gigantes
const MAX_ARRAY_LENGTH = 100; // evita logs con arrays enormes
const MAX_DEPTH = 4; // evita recursiones profundas

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && v.constructor === Object;
}

function shouldRedact(key: string): boolean {
  const k = key.toLowerCase();
  return REDACT_KEYS.some((s) => k === s.toLowerCase());
}

function truncateString(s: string): string {
  if (s.length <= MAX_STRING_LENGTH) return s;
  return (
    s.slice(0, MAX_STRING_LENGTH) +
    `…[${s.length - MAX_STRING_LENGTH} more chars]`
  );
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[Object depth limit]';

  if (value == null) return value;

  if (typeof value === 'string') return truncateString(value);

  if (Array.isArray(value)) {
    const arr = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((v) => redact(v, depth + 1));
    if (value.length > MAX_ARRAY_LENGTH) {
      arr.push(`[+${value.length - MAX_ARRAY_LENGTH} more items]`);
    }
    return arr;
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (shouldRedact(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }

  // Evitar loggear buffers/binaries completos
  if (value instanceof Buffer) return `[Buffer ${value.length} bytes]`;

  return value;
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(redact(value));
  } catch {
    return '[Unserializable]';
  }
}
