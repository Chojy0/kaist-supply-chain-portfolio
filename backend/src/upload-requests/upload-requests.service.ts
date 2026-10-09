import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UploadRequest,
  UploadRequestStatus,
  Priority,
  LcaMethodology,
  SystemBoundary,
} from './upload-request.entity';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto';
import { UpdateUploadRequestDto } from './dto/update-upload-request.dto';
import { User, UserRole } from '../users/user.entity';
import { LogExecutionTime } from '../common/decorators/log-execution-time.decorator';

@Injectable()
export class UploadRequestsService {
  constructor(
    @InjectRepository(UploadRequest)
    private uploadRequestRepository: Repository<UploadRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @LogExecutionTime()
  async create(
    createDto: CreateUploadRequestDto,
    tier1SupplierId: string,
  ): Promise<UploadRequest> {
    if (!Number.isFinite(new Date(createDto.deadline).getTime()) || new Date(createDto.deadline).getTime() <= Date.now()) throw new BadRequestException('Deadline must be in the future');
    // 1차 협력사만 요청 생성 가능
    const tier1Supplier = await this.userRepository.findOne({
      where: { id: tier1SupplierId },
    });
    if (!tier1Supplier || tier1Supplier.role !== UserRole.TIER1_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 1 suppliers can create upload requests',
      );
    }

    // 2차 이상 협력사 확인
    const tier2plusSupplier = await this.userRepository.findOne({
      where: { id: createDto.tier2plusSupplierId },
      relations: ['parentSupplier'],
    });
    if (
      !tier2plusSupplier ||
      tier2plusSupplier.role !== UserRole.TIER2PLUS_SUPPLIER
    ) {
      throw new NotFoundException('Tier 2+ supplier not found');
    }

    // 2차 이상 협력사가 해당 1차 협력사의 하위 협력사인지 확인
    if (tier2plusSupplier.parentSupplierId !== tier1SupplierId) {
      throw new ForbiddenException(
        'The specified supplier is not your sub-supplier',
      );
    }

    const uploadRequest = this.uploadRequestRepository.create({
      tier1SupplierId,
      tier2plusSupplierId: createDto.tier2plusSupplierId,
      productName: createDto.productName,
      description: createDto.description,
      deadline: new Date(createDto.deadline),
      priority: createDto.priority || Priority.MEDIUM,
      status: UploadRequestStatus.PENDING,
      lcaMethodology: createDto.lcaMethodology || LcaMethodology.ISO_14040,
      systemBoundary: createDto.systemBoundary || SystemBoundary.CRADLE_TO_GATE,
      functionalUnit: createDto.functionalUnit,
      requiredStages: createDto.requiredStages || [],
      impactCategories: createDto.impactCategories || ['carbon_footprint'],
    });

    return this.uploadRequestRepository.save(uploadRequest);
  }

  @LogExecutionTime()
  async findAll(userId: string, userRole: UserRole): Promise<UploadRequest[]> {
    if (userRole === UserRole.TIER1_SUPPLIER) {
      // 1차 협력사: 자신이 생성한 요청 목록
      return this.uploadRequestRepository.find({
        where: { tier1SupplierId: userId },
        relations: ['tier2plusSupplier'],
        order: { createdAt: 'DESC' },
      });
    } else if (userRole === UserRole.TIER2PLUS_SUPPLIER) {
      // 2차 이상 협력사: 자신이 받은 요청 목록
      return this.uploadRequestRepository.find({
        where: { tier2plusSupplierId: userId },
        relations: ['tier1Supplier'],
        order: { createdAt: 'DESC' },
      });
    } else {
      throw new ForbiddenException('Invalid user role');
    }
  }

  @LogExecutionTime()
  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<UploadRequest> {
    const uploadRequest = await this.uploadRequestRepository.findOne({
      where: { id },
      relations: ['tier1Supplier', 'tier2plusSupplier', 'lcaDataList'],
    });

    if (!uploadRequest) {
      throw new NotFoundException('Upload request not found');
    }

    // 권한 확인
    if (
      (userRole === UserRole.TIER1_SUPPLIER &&
        uploadRequest.tier1SupplierId !== userId) ||
      (userRole === UserRole.TIER2PLUS_SUPPLIER &&
        uploadRequest.tier2plusSupplierId !== userId)
    ) {
      throw new ForbiddenException('Access denied');
    }

    return uploadRequest;
  }

  @LogExecutionTime()
  async updateStatus(
    id: string,
    status: UploadRequestStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<UploadRequest> {
    const uploadRequest = await this.findOne(id, userId, userRole);

    if (userRole !== UserRole.TIER1_SUPPLIER || status !== UploadRequestStatus.CANCELLED || uploadRequest.status !== UploadRequestStatus.PENDING) throw new ConflictException('Request progress is controlled by submission and review');
    uploadRequest.status = status;
    return this.uploadRequestRepository.save(uploadRequest);
  }

  @LogExecutionTime()
  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const uploadRequest = await this.findOne(id, userId, userRole);

    // 1차 협력사만 자신이 생성한 요청 삭제 가능
    if (userRole !== UserRole.TIER1_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 1 suppliers can delete upload requests',
      );
    }

    if (uploadRequest.tier1SupplierId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own upload requests',
      );
    }

    throw new ConflictException('Use cancellation to preserve request history');
  }

  @LogExecutionTime()
  async update(
    id: string,
    updateDto: UpdateUploadRequestDto,
    userId: string,
    userRole: UserRole,
  ): Promise<UploadRequest> {
    const uploadRequest = await this.findOne(id, userId, userRole);

    // 1차 협력사만 자신이 생성한 요청 수정 가능
    if (userRole !== UserRole.TIER1_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 1 suppliers can update upload requests',
      );
    }

    if (uploadRequest.tier1SupplierId !== userId) {
      throw new ForbiddenException(
        'You can only update your own upload requests',
      );
    }

    if (uploadRequest.status !== UploadRequestStatus.PENDING) throw new ConflictException('Requests with submissions cannot be edited');
    // 업데이트할 필드 적용
    if (updateDto.productName !== undefined) {
      uploadRequest.productName = updateDto.productName;
    }
    if (updateDto.description !== undefined) {
      uploadRequest.description = updateDto.description;
    }
    if (updateDto.deadline !== undefined) {
      uploadRequest.deadline = new Date(updateDto.deadline);
    }
    if (updateDto.priority !== undefined) {
      uploadRequest.priority = updateDto.priority;
    }
    if (updateDto.lcaMethodology !== undefined) {
      uploadRequest.lcaMethodology = updateDto.lcaMethodology;
    }
    if (updateDto.systemBoundary !== undefined) {
      uploadRequest.systemBoundary = updateDto.systemBoundary;
    }
    if (updateDto.functionalUnit !== undefined) {
      uploadRequest.functionalUnit = updateDto.functionalUnit;
    }
    if (updateDto.requiredStages !== undefined) {
      uploadRequest.requiredStages = updateDto.requiredStages;
    }
    if (updateDto.impactCategories !== undefined) {
      uploadRequest.impactCategories = updateDto.impactCategories;
    }

    return this.uploadRequestRepository.save(uploadRequest);
  }
}
