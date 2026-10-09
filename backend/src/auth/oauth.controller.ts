import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OAuthTokenDto } from './dto/oauth-token.dto';
import { OAuthRefreshDto } from './dto/oauth-refresh.dto';

@ApiTags('OAuth2')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  @ApiOperation({
    summary: 'OAuth2 Token',
    description: 'OAuth2 Password Grant - username/password로 토큰 발급',
  })
  @ApiResponse({ status: 200, description: '토큰 발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async token(@Body() oauthTokenDto: OAuthTokenDto) {
    const result = await this.authService.login({
      email: oauthTokenDto.username,
      password: oauthTokenDto.password,
    });

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      token_type: 'Bearer',
      expires_in: 604800, // 7 days in seconds
    };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'OAuth2 Refresh Token',
    description: 'Refresh Token으로 새로운 Access Token과 Refresh Token 발급',
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  async refresh(@Body() oauthRefreshDto: OAuthRefreshDto) {
    const result = await this.authService.refreshAccessToken(
      oauthRefreshDto.refresh_token,
    );

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      token_type: 'Bearer',
      expires_in: 604800, // 7 days in seconds
    };
  }
}
