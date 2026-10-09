import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLcaDataDto {
  @ApiPropertyOptional({
    example: '배터리 셀',
    description: '제품명',
  })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({
    example: { rawMaterial: { co2: 100 }, manufacturing: { co2: 50 } },
    description: 'Life Cycle Stages별 Inventory Data',
  })
  @IsObject()
  @IsOptional()
  inventoryData?: Record<string, any>;

  @ApiPropertyOptional({
    example: { carbonFootprint: 150, waterFootprint: 200 },
    description: 'Impact Assessment 결과',
  })
  @IsObject()
  @IsOptional()
  impactAssessment?: Record<string, any>;

  @ApiPropertyOptional({
    example: '1 kWh',
    description: '기능 단위',
  })
  @IsString()
  @IsOptional()
  functionalUnit?: string;

  @ApiPropertyOptional({
    example: '2024',
    description: '기준 연도',
  })
  @IsString()
  @IsOptional()
  referenceYear?: string;

  @ApiPropertyOptional({
    example: 'high',
    description: '데이터 품질',
  })
  @IsString()
  @IsOptional()
  dataQuality?: string;
}
