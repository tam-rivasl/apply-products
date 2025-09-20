import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../common/services/logger.service';
import { LogSecurityOperation } from '../common/decorators/log-method.decorator';

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;

  constructor(
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new LoggerService(this.configService);
  }

  // Para la prueba no validamos password/DB; se firma un payload mínimo.
  @LogSecurityOperation('auth.login')
  async login(email = 'test@example.com') {
    this.logger.authEvent('Login attempt', undefined, { email });

    const payload = { sub: email, email };
    const access_token = this.jwt.sign(payload);

    this.logger.authEvent('Login successful', email, { 
      tokenGenerated: true,
      expiresIn: this.jwt['options']?.expiresIn || '1h'
    });

    return { access_token };
  }
}
