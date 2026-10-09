import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackType } from '../feedback.entity';

export class FindFeedbackDto {
  @ApiPropertyOptional({
    example: 'uuid-lca-data-id',
    description: 'LCA 데이터 ID로 필터링',
  })
  @IsString()
  @IsOptional()
  lcaDataId?: string;

  @ApiPropertyOptional({
    example: 'uuid-tier1-supplier-id',
    description: '1차 협력사 ID로 필터링',
  })
  @IsString()
  @IsOptional()
  tier1SupplierId?: string;

  @ApiPropertyOptional({
    example: 'approval',
    description: '피드백 유형으로 필터링',
    enum: FeedbackType,
  })
  @IsEnum(FeedbackType)
  @IsOptional()
  type?: FeedbackType;
}