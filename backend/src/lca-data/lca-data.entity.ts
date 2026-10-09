import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { UploadRequest } from '../upload-requests/upload-request.entity';
import { Feedback } from '../feedback/feedback.entity';

export enum LcaDataStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

@Entity('lca_data')
@Index('one_active_submission_per_request', ['uploadRequestId'], {unique: true, where: "status IN ('submitted', 'reviewed', 'approved')"})
@Index('idx_lca_data_supplier', ['supplierId'])
@Index('idx_lca_data_tier1_supplier', ['tier1SupplierId'])
@Index('idx_lca_data_upload_request', ['uploadRequestId'])
@Index('idx_lca_data_status', ['status'])
export class LcaData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 2차 이상 협력사 (데이터 업로드자)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  // 1차 협력사 (데이터 소유자/관리자)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'tier1_supplier_id' })
  tier1Supplier: User;

  @Column({ name: 'tier1_supplier_id' })
  tier1SupplierId: string;

  @ManyToOne(() => UploadRequest, { nullable: true })
  @JoinColumn({ name: 'upload_request_id' })
  uploadRequest: UploadRequest;

  @Column({ name: 'upload_request_id', nullable: true })
  uploadRequestId: string | null;

  @Column()
  productName: string;

  // 파일 정보 (원본 데이터)
  @Column({ type: 'varchar', name: 'file_path', nullable: true })
  filePath: string | null;

  @Column({ type: 'varchar', name: 'file_name', nullable: true })
  fileName: string | null;

  @Column({ type: 'integer', name: 'file_size', nullable: true })
  fileSize: number | null;

  @Column({ type: 'varchar', name: 'file_hash', nullable: true })
  fileHash: string | null;

  // 구조화된 LCA 데이터 (JSON)
  // Life Cycle Stages별 Inventory Data
  // 예: { "raw_material": { "materials": [...], "energy": [...], "emissions": [...] }, ... }
  @Column({ type: 'json', nullable: true, name: 'inventory_data' })
  inventoryData: Record<string, any> | null;

  // Impact Assessment 결과
  // 예: { "carbon_footprint": { "value": 123.45, "unit": "kg CO2-eq" }, ... }
  @Column({ type: 'json', nullable: true, name: 'impact_assessment' })
  impactAssessment: Record<string, any> | null;

  // 메타데이터
  @Column({ type: 'text', nullable: true, name: 'functional_unit' })
  functionalUnit: string | null; // 기능 단위

  @Column({ type: 'text', nullable: true, name: 'reference_year' })
  referenceYear: string | null; // 기준년도

  @Column({ type: 'text', nullable: true, name: 'data_quality' })
  dataQuality: string | null; // 데이터 품질 (예: "primary", "secondary", "estimated")

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
    name: 'verification_status',
  })
  verificationStatus: VerificationStatus;

  @Column({
    type: 'enum',
    enum: LcaDataStatus,
    default: LcaDataStatus.DRAFT,
  })
  status: LcaDataStatus;

  @OneToMany(() => Feedback, (feedback) => feedback.lcaData)
  feedbacks: Feedback[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
