import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    // Fail-fast in production if JWT_SECRET is not set
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production environment');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'your_jwt_secret_change_me',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email, name: user.name };
  }
}
