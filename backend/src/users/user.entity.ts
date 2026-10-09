import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum UserRole {
  TIER1_SUPPLIER = 'tier1_supplier', // 1차 협력사 (메인 고객)
  TIER2PLUS_SUPPLIER = 'tier2plus_supplier', // 2차 이상 협력사
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  // 1차 협력사와 2차 이상 협력사 간의 관계
  // 2차 이상 협력사인 경우, 상위 1차 협력사를 참조
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'parent_supplier_id' })
  parentSupplier: User;

  @Column({ name: 'parent_supplier_id', nullable: true })
  parentSupplierId: string;

  // 1차 협력사인 경우, 하위 협력사 목록
  @OneToMany(() => User, (user) => user.parentSupplier)
  subSuppliers: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
