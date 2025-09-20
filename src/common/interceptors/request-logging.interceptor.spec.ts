import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { LoggerService } from '../services/logger.service';

describe('RequestLoggingInterceptor', () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as jest.Mocked<LoggerService>;
  const interceptor = new RequestLoggingInterceptor(logger);

  const createContext = (request: any, response: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs request and response metadata', async () => {
    const request = {
      method: 'POST',
      originalUrl: '/products',
      url: '/products',
      headers: { 'user-agent': 'jest', authorization: 'secret' },
      body: { name: 'Laptop' },
      query: {},
      params: {},
      ip: '127.0.0.1',
    };
    const response = { statusCode: 201 };
    const ctx = createContext(request, response);
    const handler: CallHandler = { handle: () => of({ ok: true, id: 1 }) };

    await lastValueFrom(interceptor.intercept(ctx, handler));

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('POST /products'),
      expect.objectContaining({ operation: 'http.request', traceId: expect.any(String) }),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('POST /products - 201'),
      expect.objectContaining({ operation: 'http.response', duration: expect.any(Number) }),
    );
    expect(request).toHaveProperty('traceId');
  });

  it('logs errors bubbling from handler', async () => {
    const request = {
      method: 'GET',
      originalUrl: '/fail',
      url: '/fail',
      headers: {},
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
    };
    const response = { statusCode: 500 };
    const ctx = createContext(request, response);
    const handler: CallHandler = {
      handle: () => throwError(() => Object.assign(new Error('Boom'), { status: 500 })),
    };

    await expect(lastValueFrom(interceptor.intercept(ctx, handler))).rejects.toThrow('Boom');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('GET /fail - 500'),
      expect.objectContaining({ operation: 'http.error' }),
    );
  });
});
