import { readFile } from 'fs/promises';
import { resolve, sep } from 'path';
import {
  Controller,
  StreamableFile,
  NotFoundException,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LcaDataService } from './lca-data.service';
import { UploadLcaDataDto } from './dto/upload-lca-data.dto';
import { UpdateLcaDataDto } from './dto/update-lca-data.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { LcaDataStatus } from './lca-data.entity';
import { LcaFileValidator } from '../common/validators/lca-file.validator';
import {
  ApiTags,
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('LCA Data')
@ApiOAuth2(['oauth2'])
@UseGuards(JwtAuthGuard)
@Controller('lca-data')
export class LcaDataController {
  constructor(private readonly lcaDataService: LcaDataService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'LCA 데이터 업로드',
    description: 'LCA 데이터를 파일 또는 JSON 형태로 업로드합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'LCA 데이터 파일 (Excel, CSV, JSON) - 선택사항',
        },
        productName: {
          type: 'string',
          example: '배터리 셀',
          description: '제품명',
        },
        uploadRequestId: {
          type: 'string',
          example: 'uuid-upload-request-id',
          description: '업로드 요청 ID (선택사항)',
        },
        inventoryData: {
          type: 'string',
          example: '{"rawMaterial":{"co2":100},"manufacturing":{"co2":50}}',
          description: 'Inventory Data (JSON 문자열)',
        },
        impactAssessment: {
          type: 'string',
          example: '{"carbonFootprint":150,"waterFootprint":200}',
          description: 'Impact Assessment (JSON 문자열)',
        },
        functionalUnit: {
          type: 'string',
          example: '1 kWh',
          description: '기능 단위',
        },
        referenceYear: {
          type: 'string',
          example: '2024',
          description: '기준 연도',
        },
        dataQuality: {
          type: 'string',
          example: 'high',
          description: '데이터 품질',
        },
      },
      required: ['productName'],
    },
  })
  @ApiResponse({ status: 201, description: 'LCA 데이터 업로드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (파일 형식 오류 등)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseInterceptors(FileInterceptor('file', {limits: {fileSize: 10 * 1024 * 1024, files: 1, fields: 10}}))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new LcaFileValidator(),
        ],
        fileIsRequired: false, // 파일은 선택사항
      }),
    )
    file: Express.Multer.File | undefined,
    @Body() uploadDto: UploadLcaDataDto,
    @CurrentUser() user: User,
  ) {
    // 파일 또는 구조화된 데이터 중 하나는 필수
    if (!file && !uploadDto.inventoryData && !uploadDto.impactAssessment) {
      throw new BadRequestException(
        'Either file or structured data (inventoryData/impactAssessment) must be provided',
      );
    }

    return this.lcaDataService.upload(file || null, uploadDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'LCA 데이터 목록 조회',
    description: '사용자의 역할에 따른 LCA 데이터 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: 'LCA 데이터 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findAll(@CurrentUser() user: User) {
    return this.lcaDataService.findAll(user.id, user.role);
  }

  @Get(':id/file')
  async download(@Param('id') id: string, @CurrentUser() user: User) {
    const data = await this.lcaDataService.findOne(id, user.id, user.role);
    const root = resolve(process.cwd(), 'uploads') + sep;
    if (!data.filePath || !resolve(data.filePath).startsWith(root)) throw new NotFoundException('File not found');
    let buffer: Buffer;
    try {buffer = await readFile(data.filePath);} catch {throw new NotFoundException('File not found');}
    return new StreamableFile(buffer, {type: 'application/octet-stream', disposition: `attachment; filename*=UTF-8''${encodeURIComponent(data.fileName || 'evidence')}`});
  }

  @Get(':id')
  @ApiOperation({
    summary: 'LCA 데이터 상세 조회',
    description: '특정 LCA 데이터의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: 'LCA 데이터 상세 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: 'LCA 데이터를 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.lcaDataService.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'LCA 데이터 상태 변경',
    description: 'LCA 데이터의 상태를 변경합니다.',
  })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: LcaDataStatus,
    @CurrentUser() user: User,
  ) {
    return this.lcaDataService.updateStatus(id, status, user.id, user.role);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'LCA 데이터 수정',
    description:
      'LCA 데이터를 수정합니다. 2차 이상 협력사만 자신이 업로드한 데이터를 수정할 수 있습니다.',
  })
  @ApiResponse({ status: 200, description: 'LCA 데이터 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '수정 권한 없음' })
  @ApiResponse({ status: 404, description: 'LCA 데이터를 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLcaDataDto,
    @CurrentUser() user: User,
  ) {
    return this.lcaDataService.update(id, updateDto, user.id, user.role);
  }

  @Put(':id/file')
  @ApiOperation({
    summary: 'LCA 데이터 파일 수정',
    description:
      'LCA 데이터의 파일을 수정합니다. 2차 이상 협력사만 자신이 업로드한 데이터의 파일을 수정할 수 있습니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'LCA 데이터 파일 (Excel, CSV, JSON)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'LCA 데이터 파일 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (파일 형식 오류 등)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '수정 권한 없음' })
  @ApiResponse({ status: 404, description: 'LCA 데이터를 찾을 수 없음' })
  @UseInterceptors(FileInterceptor('file', {limits: {fileSize: 10 * 1024 * 1024, files: 1, fields: 10}}))
  updateFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new LcaFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.lcaDataService.updateFile(id, file, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'LCA 데이터 삭제',
    description:
      'LCA 데이터를 삭제합니다. 2차 이상 협력사만 자신이 업로드한 데이터를 삭제할 수 있습니다.',
  })
  @ApiResponse({ status: 200, description: 'LCA 데이터 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: 'LCA 데이터를 찾을 수 없음' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.lcaDataService.delete(id, user.id, user.role);
  }
}
