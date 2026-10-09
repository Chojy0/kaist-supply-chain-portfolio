import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '이메일/비밀번호로 로그인하여 JWT 토큰 발급',
  })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({
    status: 401,
    description: '인증 실패 - 이메일 또는 비밀번호 불일치',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginPrev(loginDto);
  }
}
