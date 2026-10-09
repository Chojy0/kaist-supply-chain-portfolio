import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Priority,
  LcaMethodology,
  SystemBoundary,
  LifeCycleStage,
} from '../upload-request.entity';

export class UpdateUploadRequestDto {
  @ApiPropertyOptional({
    example: '배터리 셀',
    description: '제품명',
  })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({
    example: 'LCA 데이터 업로드 요청입니다.',
    description: '요청 설명',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: '마감일 (ISO 8601 형식)',
  })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({
    example: 'high',
    description: '우선순위',
    enum: Priority,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    example: 'iso_14040',
    description: 'LCA 방법론',
    enum: LcaMethodology,
  })
  @IsEnum(LcaMethodology)
  @IsOptional()
  lcaMethodology?: LcaMethodology;

  @ApiPropertyOptional({
    example: 'cradle_to_gate',
    description: '시스템 경계',
    enum: SystemBoundary,
  })
  @IsEnum(SystemBoundary)
  @IsOptional()
  systemBoundary?: SystemBoundary;

  @ApiPropertyOptional({
    example: '1 kWh',
    description: '기능 단위',
  })
  @IsString()
  @IsOptional()
  functionalUnit?: string;

  @ApiPropertyOptional({
    example: ['raw_material', 'manufacturing'],
    description: '수집할 Life Cycle Stages',
    enum: LifeCycleStage,
    isArray: true,
  })
  @IsArray()
  @IsEnum(LifeCycleStage, { each: true })
  @IsOptional()
  requiredStages?: LifeCycleStage[];

  @ApiPropertyOptional({
    example: ['carbon_footprint', 'water_footprint'],
    description: '영향 범위',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  impactCategories?: string[];
}
