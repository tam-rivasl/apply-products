import { redact, safeStringify } from './logsafe';

describe('logsafe utilities', () => {
  it('redacts sensitive keys and truncates long strings', () => {
    const input = {
      password: 'secret',
      token: 'abc',
      description: 'a'.repeat(2_100),
    };

    const output = redact(input) as any;
    expect(output.password).toBe('[REDACTED]');
    expect(output.token).toBe('[REDACTED]');
    expect(output.description).toContain('more chars');
  });

  it('limits arrays and buffers for logging', () => {
    const arr = Array.from({ length: 105 }, (_, i) => i);
    const redacted = redact(arr) as any[];
    expect(redacted).toHaveLength(101);
    expect(redacted[redacted.length - 1]).toContain('more items');

    const bufferResult = redact(Buffer.from('hi'));
    expect(bufferResult).toBe('[Buffer 2 bytes]');
  });

  it('safeStringify survives circular structures', () => {
    const obj: any = { foo: 'bar' };
    obj.self = obj;
    expect(safeStringify(obj)).toContain('foo');
  });
});
