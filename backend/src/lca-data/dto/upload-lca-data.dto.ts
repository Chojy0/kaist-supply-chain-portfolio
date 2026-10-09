import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UploadLcaDataDto {
  @ApiProperty({
    example: '배터리 셀',
    description: '제품명',
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiPropertyOptional({
    example: 'uuid-upload-request-id',
    description: '업로드 요청 ID',
  })
  @IsString()
  @IsOptional()
  uploadRequestId?: string;

  @ApiPropertyOptional({
    example: '{"rawMaterial":{"co2":100},"manufacturing":{"co2":50}}',
    description: 'Life Cycle Stages별 Inventory Data (JSON 문자열)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  @IsOptional()
  inventoryData?: Record<string, any>;

  @ApiPropertyOptional({
    example: '{"carbonFootprint":150,"waterFootprint":200}',
    description: 'Impact Assessment 결과 (JSON 문자열)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
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
