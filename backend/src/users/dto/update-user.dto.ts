import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'password123',
    description: '새 비밀번호 (최소 6자)',
    minLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    example: '홍길동',
    description: '사용자 이름',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
