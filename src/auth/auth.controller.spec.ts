import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const service = { login: jest.fn() } as unknown as jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('delegates login to service with provided email', async () => {
    service.login.mockResolvedValue({ access_token: 'token' });

    await expect(
      controller.login({ email: 'user@example.com' }),
    ).resolves.toEqual({ access_token: 'token' });
    expect(service.login).toHaveBeenCalledWith('user@example.com');
  });

  it('uses default email when not provided', async () => {
    service.login.mockResolvedValue({ access_token: 'token' });

    await controller.login({});
    expect(service.login).toHaveBeenCalledWith('test@example.com');
  });
});
