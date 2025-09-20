import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const createHost = (request: Partial<any>, response: any): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    }) as unknown as ArgumentsHost;

  const baseRequest = {
    url: '/test',
    method: 'POST',
    headers: { 'user-agent': 'jest' },
    ip: '127.0.0.1',
  };

  let response: { status: jest.Mock; json: jest.Mock };
  let appLogger: { error: jest.Mock };
  let filter: GlobalExceptionFilter;
  let nestLogger: { error: jest.Mock };

  beforeEach(() => {
    response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    appLogger = { error: jest.fn() };
    filter = new GlobalExceptionFilter(appLogger as any);
    nestLogger = { error: jest.fn() };
    (filter as any).logger = nestLogger;
  });

  it('handles custom BaseException instances', () => {
    const exception = new BadRequestException({
      message: 'invalid',
      context: { field: 'name' },
    });
    const host = createHost(baseRequest, response);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'invalid',
        }),
      }),
    );
    expect(appLogger.error).toHaveBeenCalled();
    expect(nestLogger.error).toHaveBeenCalled();
  });

  it('handles HttpException payloads', () => {
    const exception = new HttpException(
      { message: 'Forbidden', details: { reason: 'nope' } },
      HttpStatus.FORBIDDEN,
    );
    const host = createHost(baseRequest, response);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Forbidden',
          details: { message: 'Forbidden', details: { reason: 'nope' } },
        }),
      }),
    );
    expect(appLogger.error).toHaveBeenCalled();
  });

  it('handles unknown errors gracefully', () => {
    const error = new Error('Boom');
    const host = createHost(baseRequest, response);

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Internal server error' }),
      }),
    );
    expect(nestLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
      expect.objectContaining({ status: 500 }),
      error.stack,
    );
  });
});
