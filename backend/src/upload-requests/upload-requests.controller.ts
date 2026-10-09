import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UploadRequestsService } from './upload-requests.service';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto';
import { UpdateUploadRequestDto } from './dto/update-upload-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { UploadRequestStatus } from './upload-request.entity';
import { ApiTags, ApiOAuth2, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Upload Requests')
@ApiOAuth2(['oauth2'])
@UseGuards(JwtAuthGuard)
@Controller('upload-requests')
export class UploadRequestsController {
  constructor(private readonly uploadRequestsService: UploadRequestsService) {}

  @Post()
  @ApiOperation({
    summary: '업로드 요청 생성',
    description: '하위 협력사에게 LCA 데이터 업로드를 요청합니다.',
  })
  @ApiResponse({ status: 201, description: '업로드 요청 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  create(@Body() createDto: CreateUploadRequestDto, @CurrentUser() user: User) {
    return this.uploadRequestsService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: '업로드 요청 목록 조회',
    description: '사용자의 역할에 따른 업로드 요청 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '업로드 요청 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findAll(@CurrentUser() user: User) {
    return this.uploadRequestsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({
    summary: '업로드 요청 상세 조회',
    description: '특정 업로드 요청의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '업로드 요청 상세 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '업로드 요청을 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.uploadRequestsService.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: '업로드 요청 상태 변경',
    description: '업로드 요청의 상태를 변경합니다.',
  })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: UploadRequestStatus,
    @CurrentUser() user: User,
  ) {
    return this.uploadRequestsService.updateStatus(
      id,
      status,
      user.id,
      user.role,
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: '업로드 요청 수정',
    description:
      '업로드 요청을 수정합니다. 1차 협력사만 자신이 생성한 요청을 수정할 수 있습니다.',
  })
  @ApiResponse({ status: 200, description: '업로드 요청 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '수정 권한 없음' })
  @ApiResponse({ status: 404, description: '업로드 요청을 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUploadRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.uploadRequestsService.update(id, updateDto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '업로드 요청 삭제',
    description:
      '업로드 요청을 삭제합니다. 1차 협력사만 자신이 생성한 요청을 삭제할 수 있습니다.',
  })
  @ApiResponse({ status: 200, description: '업로드 요청 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '업로드 요청을 찾을 수 없음' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.uploadRequestsService.delete(id, user.id, user.role);
  }
}
