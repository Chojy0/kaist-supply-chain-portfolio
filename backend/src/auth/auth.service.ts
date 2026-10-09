import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogExecutionTime } from '../common/decorators/log-execution-time.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  UnauthorizedException,
  ConflictException,
} from '../common/exceptions/business.exception';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @LogExecutionTime()
  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    this.logger.info(`Attempting to register user: ${email}`, {
      context: 'AuthService',
    });

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists - ${email}`, {
        context: 'AuthService',
      });
      throw new ConflictException('Email already exists');
    }

    const user = await this.usersService.create(email, password, name, role);
    this.logger.info(`User registered successfully: ${email}`, {
      context: 'AuthService',
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  @LogExecutionTime()
  async login(loginDto: LoginDto) {
    // OAuth2 username을 email로 매핑
    const email = loginDto.email;
    const password = loginDto.password;

    this.logger.info(`Login attempt for user: ${email}`, {
      context: 'AuthService',
    });

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login failed: User not found - ${email}`, {
        context: 'AuthService',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${email}`, {
        context: 'AuthService',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.info(`User logged in successfully: ${email}`, {
      context: 'AuthService',
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async loginPrev(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  /**
   * Generate Refresh Token (30 days expiration)
   */
  private generateRefreshToken(userId: string, email: string): string {
    const payload = { sub: userId, email, type: 'refresh' };
    const refreshTokenExpiration = this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION',
      '30d',
    );

    return this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiration,
    });
  }

  /**
   * Refresh Access Token using Refresh Token
   */
  @LogExecutionTime()
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload: any = this.jwtService.verify(refreshToken);

      // Verify it's a refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Validate user still exists and is active
      const user = await this.validateUser(payload.sub);

      this.logger.info(`Access token refreshed for user: ${user.email}`, {
        context: 'AuthService',
      });

      // Generate new access token and refresh token
      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });
      const newRefreshToken = this.generateRefreshToken(user.id, user.email);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      this.logger.warn(`Refresh token verification failed: ${error.message}`, {
        context: 'AuthService',
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
