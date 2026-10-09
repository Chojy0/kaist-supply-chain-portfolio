import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthTokenDto {
  @ApiProperty({
    example: 'password',
    description: 'OAuth2 Grant Type (password)',
    enum: ['password'],
    default: 'password',
  })
  @IsNotEmpty()
  @IsString()
  grant_type: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Username (email) - Required for password grant',
    required: false,
  })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password - Required for password grant',
    required: false,
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'oem-trace-client',
    description: 'OAuth2 Client ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  client_id?: string;

  @ApiProperty({
    example: 'oem-trace-secret',
    description: 'OAuth2 Client Secret',
    required: false,
  })
  @IsOptional()
  @IsString()
  client_secret?: string;
}
