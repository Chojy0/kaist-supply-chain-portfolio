import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from './user.entity';
import { ApiTags, ApiOAuth2, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: '사용자 생성',
    description: '새로운 사용자를 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createUserDto: CreateUserDto) {
    if (process.env.ALLOW_REGISTRATION !== 'true') throw new ForbiddenException('Self-registration is disabled');
    return this.usersService.create(
      createUserDto.email,
      createUserDto.password,
      createUserDto.name,
      createUserDto.role,
    );
  }

  @Get('me')
  @ApiOAuth2(['oauth2'])
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  @Get('sub-suppliers')
  @ApiOAuth2(['oauth2'])
  @ApiOperation({
    summary: '하위 협력사 목록 조회',
    description: '1차 협력사의 하위 협력사 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '하위 협력사 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (1차 협력사만 조회 가능)',
  })
  @UseGuards(JwtAuthGuard)
  getSubSuppliers(@CurrentUser() user: User) {
    // 1차 협력사만 하위 협력사 목록 조회 가능
    if (user.role !== UserRole.TIER1_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 1 suppliers can view sub-suppliers',
      );
    }
    return this.usersService.findSubSuppliers(user.id);
  }

  @Get()
  @ApiOAuth2(['oauth2'])
  @ApiOperation({
    summary: '사용자 목록 조회',
    description:
      '1차 협력사는 자신의 하위 협력사 목록을, 2차+ 협력사는 같은 그룹의 협력사 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user);
  }

  @Put(':id')
  @ApiOAuth2(['oauth2'])
  @ApiOperation({
    summary: '사용자 정보 수정',
    description: '본인의 사용자 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 정보 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '본인만 수정 가능' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.update(id, updateUserDto, user.id);
  }
}
