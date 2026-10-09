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
import { LcaData } from '../lca-data/lca-data.entity';

export enum UploadRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// LCA 방법론 표준
export enum LcaMethodology {
  ISO_14040 = 'iso_14040', // ISO 14040/14044
  GHG_PROTOCOL = 'ghg_protocol', // GHG Protocol
  PAS_2050 = 'pas_2050', // PAS 2050
  CUSTOM = 'custom', // 사용자 정의
}

// 시스템 경계 (System Boundary)
export enum SystemBoundary {
  CRADLE_TO_GATE = 'cradle_to_gate', // 원료 추출부터 공장 출고까지
  CRADLE_TO_GRAVE = 'cradle_to_grave', // 원료 추출부터 폐기까지
  GATE_TO_GATE = 'gate_to_gate', // 공정 내부만
  GATE_TO_GRAVE = 'gate_to_grave', // 공장 출고부터 폐기까지
}

// Life Cycle Stages
export enum LifeCycleStage {
  RAW_MATERIAL = 'raw_material', // 원료 추출
  MANUFACTURING = 'manufacturing', // 제조
  TRANSPORTATION = 'transportation', // 운송
  USE = 'use', // 사용
  END_OF_LIFE = 'end_of_life', // 폐기
}

@Entity('upload_requests')
@Index('idx_upload_requests_tier1_supplier', ['tier1SupplierId'])
@Index('idx_upload_requests_tier2plus_supplier', ['tier2plusSupplierId'])
@Index('idx_upload_requests_status', ['status'])
@Index('idx_upload_requests_deadline', ['deadline'])
export class UploadRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 1차 협력사 (요청자)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'tier1_supplier_id' })
  tier1Supplier: User;

  @Column({ name: 'tier1_supplier_id' })
  tier1SupplierId: string;

  // 2차 이상 협력사 (수신자)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'tier2plus_supplier_id' })
  tier2plusSupplier: User;

  @Column({ name: 'tier2plus_supplier_id' })
  tier2plusSupplierId: string;

  @Column()
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: UploadRequestStatus,
    default: UploadRequestStatus.PENDING,
  })
  status: UploadRequestStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  // LCA 방법론 정보
  @Column({
    type: 'enum',
    enum: LcaMethodology,
    default: LcaMethodology.ISO_14040,
    name: 'lca_methodology',
  })
  lcaMethodology: LcaMethodology;

  @Column({
    type: 'enum',
    enum: SystemBoundary,
    default: SystemBoundary.CRADLE_TO_GATE,
    name: 'system_boundary',
  })
  systemBoundary: SystemBoundary;

  @Column({ type: 'text', nullable: true, name: 'functional_unit' })
  functionalUnit: string; // 기능 단위 (예: "1kg 제품", "1개 제품")

  // 수집할 Life Cycle Stages (JSON 배열로 저장)
  @Column({ type: 'json', nullable: true, name: 'required_stages' })
  requiredStages: LifeCycleStage[]; // 수집이 필요한 단계들

  // 영향 범위 (Impact Categories) - JSON 배열로 저장
  @Column({ type: 'json', nullable: true, name: 'impact_categories' })
  impactCategories: string[]; // 예: ["carbon_footprint", "water_footprint", "resource_depletion"]

  @OneToMany(() => LcaData, (lcaData) => lcaData.uploadRequest)
  lcaDataList: LcaData[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
