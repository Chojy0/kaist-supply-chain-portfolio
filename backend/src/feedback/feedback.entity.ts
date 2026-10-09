import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { LcaData } from '../lca-data/lca-data.entity';

export enum FeedbackType {
  COMMENT = 'comment',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
}

@Entity('feedbacks')
@Index('idx_feedbacks_lca_data', ['lcaDataId'])
@Index('idx_feedbacks_tier1_supplier', ['tier1SupplierId'])
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LcaData, { nullable: false })
  @JoinColumn({ name: 'lca_data_id' })
  lcaData: LcaData;

  @Column({ name: 'lca_data_id' })
  lcaDataId: string;

  // 1차 협력사 (피드백 작성자)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'tier1_supplier_id' })
  tier1Supplier: User;

  @Column({ name: 'tier1_supplier_id' })
  tier1SupplierId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
    default: FeedbackType.COMMENT,
  })
  type: FeedbackType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
