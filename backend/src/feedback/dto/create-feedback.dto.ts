import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeedbackType } from '../feedback.entity';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 'uuid-lca-data-id',
    description: 'LCA 데이터 ID',
  })
  @IsString()
  @IsNotEmpty()
  lcaDataId: string;

  @ApiProperty({
    example: '데이터 검토 결과 수정이 필요합니다.',
    description: '피드백 내용',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'revision_request',
    description: '피드백 유형',
    enum: FeedbackType,
  })
  @IsEnum(FeedbackType)
  @IsNotEmpty()
  type: FeedbackType;
}
