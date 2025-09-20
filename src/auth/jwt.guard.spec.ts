import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard', () => {
  it('extends the passport jwt guard', () => {
    const jwtGuardBase = AuthGuard('jwt');
    const basePrototype = jwtGuardBase.prototype;
    const guardPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);

    expect(guardPrototype).toBe(basePrototype);
  });
});
