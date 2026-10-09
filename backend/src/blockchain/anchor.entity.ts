import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('lca_anchors')
export class Anchor {
  @PrimaryColumn('uuid') id: string;
  @Column() hash: string;
  @Column({ default: 'submitting' }) status: string;
  @Column({ nullable: true }) topicId: string;
  @Column({ nullable: true }) sequenceNumber: string;
  @Column({ nullable: true }) transactionId: string;
  @CreateDateColumn() createdAt: Date;
}
