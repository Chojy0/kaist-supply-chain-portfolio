import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FindFeedbackDto } from './dto/find-feedback.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ApiTags, ApiOAuth2, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Feedback')
@ApiOAuth2(['oauth2'])
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: '피드백 생성',
    description: 'LCA 데이터에 대한 피드백을 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '피드백 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  create(@Body() createDto: CreateFeedbackDto, @CurrentUser() user: User) {
    return this.feedbackService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: '피드백 목록 조회',
    description: '피드백 목록을 조회합니다. 쿼리 파라미터로 필터링 가능합니다.',
  })
  @ApiResponse({ status: 200, description: '피드백 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findAll(@Query() findDto: FindFeedbackDto, @CurrentUser() user: User) {
    return this.feedbackService.findAll(findDto, user);
  }

  @Get('lca-data/:lcaDataId')
  @ApiOperation({
    summary: 'LCA 데이터별 피드백 조회',
    description: '특정 LCA 데이터에 대한 모든 피드백을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '피드백 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  findByLcaDataId(@Param('lcaDataId') lcaDataId: string, @CurrentUser() user: User) {
    return this.feedbackService.findByLcaDataId(lcaDataId, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: '피드백 상세 조회',
    description: '특정 피드백의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '피드백 상세 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '피드백을 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.feedbackService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({
    summary: '피드백 수정',
    description:
      '특정 피드백을 수정합니다. 본인이 작성한 피드백만 수정 가능합니다.',
  })
  @ApiResponse({ status: 200, description: '피드백 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '수정 권한 없음' })
  @ApiResponse({ status: 404, description: '피드백을 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeedbackDto,
    @CurrentUser() user: User,
  ) {
    return this.feedbackService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '피드백 삭제',
    description:
      '특정 피드백을 삭제합니다. 본인이 작성한 피드백만 삭제 가능합니다.',
  })
  @ApiResponse({ status: 200, description: '피드백 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '피드백을 찾을 수 없음' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.feedbackService.delete(id, user.id);
  }
}
