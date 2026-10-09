import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackType } from '../feedback.entity';

export class UpdateFeedbackDto {
  @ApiPropertyOptional({
    example: '데이터 검토 결과 수정이 필요합니다.',
    description: '피드백 내용',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: 'comment',
    description: '피드백 유형',
    enum: FeedbackType,
  })
  @IsEnum(FeedbackType)
  @IsOptional()
  type?: FeedbackType;
}
