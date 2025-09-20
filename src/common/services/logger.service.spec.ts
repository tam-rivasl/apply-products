import { LoggerService } from './logger.service';
import { ConfigService } from '@nestjs/config';

const createConfig = (
  logLevel = 'debug',
  nodeEnv = 'test',
): jest.Mocked<ConfigService> =>
  ({
    get: jest.fn((key: string) => {
      if (key === 'LOG_LEVEL') return logLevel;
      if (key === 'NODE_ENV') return nodeEnv;
      return undefined;
    }),
    getOrThrow: jest.fn(),
  }) as unknown as jest.Mocked<ConfigService>;

const createUnderlyingLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

describe('LoggerService', () => {
  let service: LoggerService;
  let config: jest.Mocked<ConfigService>;
  let underlying: ReturnType<typeof createUnderlyingLogger>;

  const initService = (logLevel = 'debug') => {
    config = createConfig(logLevel);
    service = new LoggerService(config);
    underlying = createUnderlyingLogger();
    (service as any).logger = underlying;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    initService();
  });

  it('formats informational logs with redacted context', () => {
    service.log('User login', {
      context: { password: 'secret', userId: '1' },
      operation: 'auth.login',
    });

    const message = underlying.log.mock.calls[0][0];
    expect(message).toContain('[LOG]');
    expect(message).toContain('User login');
    expect(message).toContain('[REDACTED]');
  });

  it('logs errors with stack when in development', () => {
    const error = new Error('Boom');
    service.error('Failed op', { error, context: { foo: 'bar' } });

    const message = underlying.error.mock.calls[0][0];
    expect(message).toContain('Failed op');
    expect(message).toContain('error: Error: Boom');
  });

  it('skips debug logs when level is higher', () => {
    initService('error');
    service.debug('should not log');

    expect(underlying.debug).not.toHaveBeenCalled();
    service.error('should log');
    expect(underlying.error).toHaveBeenCalled();
  });

  it('creates child logger that inherits context', () => {
    const child = service.child({
      service: 'ProductsService',
    }) as LoggerService;
    const childUnderlying = createUnderlyingLogger();
    (child as any).logger = childUnderlying;

    child.log('Child message');

    const payload = childUnderlying.log.mock.calls[0][0];
    expect(payload).toContain('[ProductsService]');
  });

  it('logs specialized operations and security events', () => {
    service.dbOperation('select', 'products', 50);
    const dbCall = underlying.debug.mock.calls.find(([msg]) =>
      msg.includes('DB select on products'),
    );
    expect(dbCall).toBeDefined();

    service.apiCall('GET', '/products', 200, 30, { attempt: 1 });
    const apiDebug = underlying.debug.mock.calls.find(([msg]) =>
      msg.includes('API GET /products'),
    );
    expect(apiDebug).toBeDefined();

    service.apiCall('POST', '/products', 500, 40);
    const apiWarn = underlying.warn.mock.calls.find(([msg]) =>
      msg.includes('API POST /products'),
    );
    expect(apiWarn).toBeDefined();

    service.authEvent('login', 'user-1');
    service.securityEvent('blocked', 'high', {} as any);
    service.performance('exec', 5, 'ms');
    service.cacheOperation('hit', 'cache-key');

    expect(underlying.log).toHaveBeenCalled();
  });
});
