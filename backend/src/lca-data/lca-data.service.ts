import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LcaData, LcaDataStatus } from './lca-data.entity';
import { UploadLcaDataDto } from './dto/upload-lca-data.dto';
import { UpdateLcaDataDto } from './dto/update-lca-data.dto';
import { User, UserRole } from '../users/user.entity';
import { UploadRequest, UploadRequestStatus } from '../upload-requests/upload-request.entity';
import { LogExecutionTime } from '../common/decorators/log-execution-time.decorator';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LcaDataService {
  constructor(
    @InjectRepository(LcaData)
    private lcaDataRepository: Repository<LcaData>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UploadRequest)
    private uploadRequestRepository: Repository<UploadRequest>,
  ) {}

  @LogExecutionTime()
  async upload(
    file: Express.Multer.File | null,
    uploadDto: UploadLcaDataDto,
    supplierId: string,
  ): Promise<LcaData> {
    // 2차 이상 협력사만 업로드 가능
    const supplier = await this.userRepository.findOne({
      where: { id: supplierId },
      relations: ['parentSupplier'],
    });
    if (!supplier || supplier.role !== UserRole.TIER2PLUS_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 2+ suppliers can upload LCA data',
      );
    }

    // 1차 협력사 확인 (parentSupplier 또는 uploadRequest에서 가져옴)
    let tier1SupplierId: string;
    let uploadRequest: UploadRequest | null = null;

    if (uploadDto.uploadRequestId) {
      uploadRequest = await this.uploadRequestRepository.findOne({
        where: { id: uploadDto.uploadRequestId },
        relations: ['tier1Supplier', 'tier2plusSupplier'],
      });
      if (!uploadRequest) {
        throw new NotFoundException('Upload request not found');
      }
      if (uploadRequest.tier2plusSupplierId !== supplierId) {
        throw new ForbiddenException(
          'Access denied: This request is not for you',
        );
      }
      if ([UploadRequestStatus.COMPLETED, UploadRequestStatus.CANCELLED].includes(uploadRequest.status)) throw new ConflictException('This request is closed');
      const active = await this.lcaDataRepository.findOne({where: {uploadRequestId: uploadRequest.id, status: In([LcaDataStatus.SUBMITTED, LcaDataStatus.REVIEWED, LcaDataStatus.APPROVED])}});
      if (active) throw new ConflictException('A submission is already awaiting review or approved');
      tier1SupplierId = uploadRequest.tier1SupplierId;
    } else {
      // UploadRequest가 없으면 parentSupplier 사용
      if (!supplier.parentSupplierId) {
        throw new ForbiddenException(
          'No parent supplier found. Please specify upload request.',
        );
      }
      tier1SupplierId = supplier.parentSupplierId;
    }

    // 파일 처리 (있는 경우)
    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let fileHash: string | null = null;

    if (file) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      fileName = path.basename(file.originalname).replace(/[\x00-\x1f]/g, '_');
      filePath = path.join(uploadsDir, crypto.randomUUID() + path.extname(fileName).toLowerCase());

      // 파일 저장
      fs.writeFileSync(filePath, file.buffer);

      // 파일 해시 생성 (블록체인 검증용)
      fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      fileSize = file.size;
    }

    const lcaData = new LcaData();
    lcaData.supplierId = supplierId;
    lcaData.tier1SupplierId = tier1SupplierId;
    lcaData.productName = uploadDto.productName;
    lcaData.filePath = filePath;
    lcaData.fileName = fileName;
    lcaData.fileSize = fileSize;
    lcaData.fileHash = fileHash;
    lcaData.status = LcaDataStatus.SUBMITTED;

    // 구조화된 데이터
    lcaData.inventoryData = uploadDto.inventoryData || null;
    lcaData.impactAssessment = uploadDto.impactAssessment || null;
    lcaData.functionalUnit = uploadDto.functionalUnit || null;
    lcaData.referenceYear = uploadDto.referenceYear || null;
    lcaData.dataQuality = uploadDto.dataQuality || null;

    if (uploadDto.uploadRequestId) {
      lcaData.uploadRequestId = uploadDto.uploadRequestId;
    }

    try {
    return await this.lcaDataRepository.manager.transaction(async manager => {
      const saved = await manager.save(LcaData, lcaData);
      if (saved.uploadRequestId) await manager.update(UploadRequest, saved.uploadRequestId, {status: saved.status === LcaDataStatus.APPROVED ? UploadRequestStatus.COMPLETED : UploadRequestStatus.IN_PROGRESS});
      return saved;
    });
    } catch (error) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if ((error as {code?: string}).code === '23505') throw new ConflictException('A submission already exists for this request');
      throw error;
    }
  }

  @LogExecutionTime()
  async findAll(userId: string, userRole: UserRole): Promise<LcaData[]> {
    if (userRole === UserRole.TIER1_SUPPLIER) {
      // 1차 협력사: 자신이 받은 데이터 (하위 협력사들로부터)
      return this.lcaDataRepository.find({
        where: { tier1SupplierId: userId },
        relations: ['supplier', 'uploadRequest', 'feedbacks'],
        order: { createdAt: 'DESC' },
      });
    } else if (userRole === UserRole.TIER2PLUS_SUPPLIER) {
      // 2차 이상 협력사: 자신이 업로드한 데이터
      return this.lcaDataRepository.find({
        where: { supplierId: userId },
        relations: ['tier1Supplier', 'uploadRequest', 'feedbacks'],
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
  ): Promise<LcaData> {
    const lcaData = await this.lcaDataRepository.findOne({
      where: { id },
      relations: ['supplier', 'tier1Supplier', 'uploadRequest', 'feedbacks'],
    });

    if (!lcaData) {
      throw new NotFoundException('LCA data not found');
    }

    // 권한 확인
    if (
      userRole === UserRole.TIER1_SUPPLIER &&
      lcaData.tier1SupplierId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (
      userRole === UserRole.TIER2PLUS_SUPPLIER &&
      lcaData.supplierId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return lcaData;
  }

  @LogExecutionTime()
  async updateStatus(
    id: string,
    status: LcaDataStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<LcaData> {
    const lcaData = await this.findOne(id, userId, userRole);

    // 1차 협력사만 상태 변경 가능 (데이터 소유자)
    if (userRole !== UserRole.TIER1_SUPPLIER) {
      throw new ForbiddenException('Only Tier 1 suppliers can update status');
    }

    throw new ConflictException('Use the feedback endpoint to approve or reject with a review note');
    lcaData.status = status;
    return this.lcaDataRepository.save(lcaData);
  }

  @LogExecutionTime()
  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const lcaData = await this.findOne(id, userId, userRole);

    if (lcaData.status !== LcaDataStatus.DRAFT) throw new ConflictException('Submitted evidence is immutable; submit a new revision after rejection');
    // 2차 이상 협력사만 자신이 업로드한 데이터 삭제 가능
    if (userRole !== UserRole.TIER2PLUS_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 2+ suppliers can delete their own LCA data',
      );
    }

    if (lcaData.supplierId !== userId) {
      throw new ForbiddenException('You can only delete your own LCA data');
    }

    // 파일 삭제 (있는 경우)
    if (lcaData.filePath && fs.existsSync(lcaData.filePath)) {
      fs.unlinkSync(lcaData.filePath);
    }

    await this.lcaDataRepository.delete(id);
  }

  @LogExecutionTime()
  async update(
    id: string,
    updateDto: UpdateLcaDataDto,
    userId: string,
    userRole: UserRole,
  ): Promise<LcaData> {
    const lcaData = await this.findOne(id, userId, userRole);

    if (lcaData.status !== LcaDataStatus.DRAFT) throw new ConflictException('Submitted evidence is immutable; submit a new revision after rejection');
    // 2차 이상 협력사만 자신이 업로드한 데이터 수정 가능
    if (userRole !== UserRole.TIER2PLUS_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 2+ suppliers can update their own LCA data',
      );
    }

    if (lcaData.supplierId !== userId) {
      throw new ForbiddenException('You can only update your own LCA data');
    }

    // 업데이트할 필드 적용
    if (updateDto.productName !== undefined) {
      lcaData.productName = updateDto.productName;
    }
    if (updateDto.inventoryData !== undefined) {
      lcaData.inventoryData = updateDto.inventoryData;
    }
    if (updateDto.impactAssessment !== undefined) {
      lcaData.impactAssessment = updateDto.impactAssessment;
    }
    if (updateDto.functionalUnit !== undefined) {
      lcaData.functionalUnit = updateDto.functionalUnit;
    }
    if (updateDto.referenceYear !== undefined) {
      lcaData.referenceYear = updateDto.referenceYear;
    }
    if (updateDto.dataQuality !== undefined) {
      lcaData.dataQuality = updateDto.dataQuality;
    }

    return this.lcaDataRepository.save(lcaData);
  }

  @LogExecutionTime()
  async updateFile(
    id: string,
    file: Express.Multer.File,
    userId: string,
    userRole: UserRole,
  ): Promise<LcaData> {
    const lcaData = await this.findOne(id, userId, userRole);

    if (lcaData.status !== LcaDataStatus.DRAFT) throw new ConflictException('Submitted evidence is immutable; submit a new revision after rejection');
    // 2차 이상 협력사만 자신이 업로드한 데이터 파일 수정 가능
    if (userRole !== UserRole.TIER2PLUS_SUPPLIER) {
      throw new ForbiddenException(
        'Only Tier 2+ suppliers can update their own LCA data file',
      );
    }

    if (lcaData.supplierId !== userId) {
      throw new ForbiddenException(
        'You can only update your own LCA data file',
      );
    }

    // 기존 파일 삭제
    if (lcaData.filePath && fs.existsSync(lcaData.filePath)) {
      fs.unlinkSync(lcaData.filePath);
    }

    // 새 파일 저장
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = path.basename(file.originalname).replace(/[\x00-\x1f]/g, '_');
    const filePath = path.join(uploadsDir, crypto.randomUUID() + path.extname(fileName).toLowerCase());

    fs.writeFileSync(filePath, file.buffer);

    // 파일 해시 생성 (블록체인 검증용)
    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // 파일 정보 업데이트
    lcaData.filePath = filePath;
    lcaData.fileName = fileName;
    lcaData.fileSize = file.size;
    lcaData.fileHash = fileHash;

    return this.lcaDataRepository.save(lcaData);
  }
}
