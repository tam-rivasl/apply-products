import { SecurityService } from './security.service';
import { SecuritySeverity } from '../enums';

describe('SecurityService', () => {
  const logger = {
    securityEvent: jest.fn(),
    log: jest.fn(),
  } as any;

  let service: SecurityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SecurityService(logger);
  });

  it('enforces rate limits and logs exceed events', () => {
    const key = '127.0.0.1:GET:/api';
    const config = { windowMs: 1000, maxRequests: 2 };

    const first = service.checkRateLimit(key, config);
    const second = service.checkRateLimit(key, config);
    const third = service.checkRateLimit(key, config);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(logger.securityEvent).toHaveBeenCalledWith(
      'Rate limit exceeded',
      SecuritySeverity.HIGH,
      expect.objectContaining({ key }),
    );
  });

  it('blocks IPs on explicit call and records stats', () => {
    service.blockIP('10.0.0.1', 'Test');
    expect(service.isIPBlocked('10.0.0.1')).toBe(true);
    expect(service.getSecurityStats()).toEqual({
      blockedIPs: 1,
      suspiciousIPs: 0,
      rateLimitEntries: 0,
    });
  });

  it('marks IP suspicious and auto blocks on critical events', () => {
    service.markIPSuspicious('10.0.0.2', 'UA');
    expect(service.getSecurityStats().suspiciousIPs).toBe(1);

    service.logSecurityEvent({
      event: 'Critical',
      severity: SecuritySeverity.CRITICAL,
      ip: '1.1.1.1',
    });
    expect(service.isIPBlocked('1.1.1.1')).toBe(true);
  });

  it('cleans expired rate limits and logs', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    service.checkRateLimit('key', { windowMs: 1, maxRequests: 1 });
    nowSpy.mockReturnValue(10);

    const cleaned = service.cleanExpiredRateLimits();
    expect(cleaned).toBe(1);
    expect(logger.log).toHaveBeenCalledWith(
      'Cleaned 1 expired rate limit entries',
    );
    nowSpy.mockRestore();
  });

  it('detects SQLi and XSS patterns', () => {
    expect(
      service.detectSQLInjection("SELECT * FROM users WHERE 'a'='a'"),
    ).toBe(true);
    expect(service.detectXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('sanitizes input and hashes sensitive data', () => {
    expect(service.sanitizeInput(' <script>hi</script> ')).toBe(
      'scripthi/script',
    );
    expect(service.hashSensitiveData('secret')).toMatch(/^[a-f0-9]+$/);
  });

  it('validates jwt format and generates secure tokens', () => {
    const token = service.generateSecureToken(10);
    expect(token).toHaveLength(10);
    expect(service.validateJWTFormat('a.b.c')).toBe(true);
    expect(service.validateJWTFormat('invalid')).toBe(false);
  });
});
