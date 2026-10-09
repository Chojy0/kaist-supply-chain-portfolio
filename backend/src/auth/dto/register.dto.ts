import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '사용자 비밀번호',
    minLength: 6,
  })
  password: string;

  @ApiPropertyOptional({
    example: '홍길동',
    description: '사용자 이름',
  })
  name: string;

  @IsEnum(UserRole)
  role: UserRole;
}
