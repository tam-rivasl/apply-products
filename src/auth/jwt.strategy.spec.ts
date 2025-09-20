import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('validates payload and exposes user info', async () => {
    const strategy = new JwtStrategy();
    await expect(strategy.validate({ sub: '1', email: 'user@example.com' })).resolves.toEqual({ sub: '1', email: 'user@example.com' });
  });
});
