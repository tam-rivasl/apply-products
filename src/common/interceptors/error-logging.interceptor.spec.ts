import { ErrorLoggingInterceptor } from './error-logging.interceptor';
import { BadRequestException } from '@nestjs/common';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('ErrorLoggingInterceptor', () => {
  const createContext = (req: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  }) as unknown as ExecutionContext;

  const baseRequest = {
    method: 'GET',
    url: '/fail',
    ip: 'localhost',
    headers: { 'user-agent': 'jest' },
  };

  let appLogger: { error: jest.Mock };
  let interceptor: ErrorLoggingInterceptor;
  let nestLogger: { error: jest.Mock };

  beforeEach(() => {
    appLogger = { error: jest.fn() };
    interceptor = new ErrorLoggingInterceptor(appLogger as any);
    nestLogger = { error: jest.fn() };
    (interceptor as any).logger = nestLogger;
  });

  it('logs generic errors', async () => {
    const handler: CallHandler = { handle: () => throwError(() => new Error('Boom')) };

    await expect(lastValueFrom(interceptor.intercept(createContext(baseRequest), handler))).rejects.toThrow('Boom');
    expect(nestLogger.error).toHaveBeenCalledWith(
      'Request failed: GET /fail',
      expect.objectContaining({ error: 'Boom' }),
    );
    expect(appLogger.error).toHaveBeenCalledWith(
      'Request failed: GET /fail',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it('logs BaseException context', async () => {
    const exception = new BadRequestException('Invalid');
    const handler: CallHandler = { handle: () => throwError(() => exception) };

    await expect(lastValueFrom(interceptor.intercept(createContext(baseRequest), handler))).rejects.toThrow('Invalid');
    expect(appLogger.error).toHaveBeenCalledWith(
      'Request failed: GET /fail',
      expect.objectContaining({ context: expect.objectContaining({ method: 'GET', url: '/fail' }) }),
    );
  });
});
