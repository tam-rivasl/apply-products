import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sync_state')
export class SyncState {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  source: string; // 'contentful:product'

  @Column({ type: 'timestamptz', nullable: true })
  lastUpdatedAt: Date | null; // último updatedAt sincronizado (Contentful)

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
