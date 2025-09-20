import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

jest.mock('../common/services/logger.service', () => ({
  LoggerService: jest.fn(),
}));

import { LoggerService } from '../common/services/logger.service';

const LoggerServiceMock = LoggerService as unknown as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let jwt: jest.Mocked<JwtService>;
  let loggerInstance: any;

  const mockJwtService = (): jest.Mocked<JwtService> => ({
    sign: jest.fn(),
  } as unknown as jest.Mocked<JwtService>);

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      if (key === 'LOG_LEVEL') return 'debug';
      if (key === 'HTTP_TIMEOUT_MS') return 15000;
      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => key),
  } as unknown as ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jwt = mockJwtService();
    loggerInstance = {
      authEvent: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      operationStart: jest.fn(),
      operationComplete: jest.fn(),
      operationFailed: jest.fn(),
      dbOperation: jest.fn(),
      apiCall: jest.fn(),
      securityEvent: jest.fn(),
      performance: jest.fn(),
      validationError: jest.fn(),
      cacheOperation: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };
    LoggerServiceMock.mockImplementation(() => loggerInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('signs the payload and returns the access token', async () => {
    jwt.sign.mockReturnValue('signed-token');

    const result = await service.login('user@example.com');

    expect(LoggerServiceMock).toHaveBeenCalledTimes(1);
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user@example.com', email: 'user@example.com' });
    expect(loggerInstance.authEvent).toHaveBeenNthCalledWith(1, 'Login attempt', undefined, { email: 'user@example.com' });
    expect(loggerInstance.authEvent).toHaveBeenNthCalledWith(2, 'Login successful', 'user@example.com', expect.objectContaining({ tokenGenerated: true }));
    expect(result).toEqual({ access_token: 'signed-token' });
  });

  it('falls back to default email when none is provided', async () => {
    jwt.sign.mockReturnValue('token');

    await service.login();

    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'test@example.com', email: 'test@example.com' });
  });
});
