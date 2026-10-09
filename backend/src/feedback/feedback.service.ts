import { UploadRequest, UploadRequestStatus } from '../upload-requests/upload-request.entity';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback, FeedbackType } from './feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FindFeedbackDto } from './dto/find-feedback.dto';
import { User, UserRole } from '../users/user.entity';
import { LcaData, LcaDataStatus } from '../lca-data/lca-data.entity';
import { LogExecutionTime } from '../common/decorators/log-execution-time.decorator';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(LcaData)
    private lcaDataRepository: Repository<LcaData>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private scope(user: User) {
    if (user.role === UserRole.TIER1_SUPPLIER) return { tier1SupplierId: user.id };
    if (user.role === UserRole.TIER2PLUS_SUPPLIER) return { supplierId: user.id };
    throw new ForbiddenException('Invalid role');
  }

  @LogExecutionTime()
  async create(
    createDto: CreateFeedbackDto,
    tier1SupplierId: string,
  ): Promise<Feedback> {
    // 1차 협력사만 피드백 작성 가능
    const tier1Supplier = await this.userRepository.findOne({
      where: { id: tier1SupplierId },
    });
    if (!tier1Supplier || tier1Supplier.role !== UserRole.TIER1_SUPPLIER) {
      throw new ForbiddenException('Only Tier 1 suppliers can create feedback');
    }

    // LCA 데이터 확인
    const lcaData = await this.lcaDataRepository.findOne({
      where: { id: createDto.lcaDataId },
      relations: ['tier1Supplier'],
    });

    if (!lcaData) {
      throw new NotFoundException('LCA data not found');
    }

    // 권한 확인 (1차 협력사가 받은 데이터인지)
    if (lcaData.tier1SupplierId !== tier1SupplierId) {
      throw new ForbiddenException(
        'Access denied: You can only provide feedback on data submitted to you',
      );
    }

    return this.feedbackRepository.manager.transaction(async manager => {
      const current = await manager.findOne(LcaData, {where: {id: lcaData.id}, lock: {mode: 'pessimistic_write'}});
      if (!current || ![LcaDataStatus.SUBMITTED, LcaDataStatus.REVIEWED].includes(current.status)) throw new ConflictException('This submission already has a final decision');
      current.status = createDto.type === FeedbackType.APPROVAL ? LcaDataStatus.APPROVED : createDto.type === FeedbackType.REJECTION ? LcaDataStatus.REJECTED : LcaDataStatus.REVIEWED;
      await manager.save(LcaData, current);
      if (current.uploadRequestId) await manager.update(UploadRequest, current.uploadRequestId, {status: current.status === LcaDataStatus.APPROVED ? UploadRequestStatus.COMPLETED : UploadRequestStatus.IN_PROGRESS});
      return manager.save(Feedback, manager.create(Feedback, {lcaDataId: current.id, tier1SupplierId, content: createDto.content, type: createDto.type}));
    });
  }

  @LogExecutionTime()
  async findAll(findDto: FindFeedbackDto, user: User): Promise<Feedback[]> {
    const where: any = { lcaData: this.scope(user) };

    if (findDto.lcaDataId) {
      where.lcaDataId = findDto.lcaDataId;
    }
    if (findDto.tier1SupplierId) {
      where.tier1SupplierId = findDto.tier1SupplierId;
    }
    if (findDto.type) {
      where.type = findDto.type;
    }

    return this.feedbackRepository.find({
      where,
      relations: ['tier1Supplier', 'lcaData'],
      order: { createdAt: 'DESC' },
    });
  }

  @LogExecutionTime()
  async findByLcaDataId(lcaDataId: string, user: User): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      where: { lcaDataId, lcaData: this.scope(user) },
      relations: ['tier1Supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  @LogExecutionTime()
  async findOne(id: string, user: User): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id, lcaData: this.scope(user) },
      relations: ['tier1Supplier', 'lcaData'],
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async delete(_id: string, _userId: string): Promise<void> { throw new ConflictException('Review history is immutable'); }
  async update(_id: string, _dto: UpdateFeedbackDto, _userId: string): Promise<Feedback> { throw new ConflictException('Review history is immutable'); }
}
