import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  contentfulId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200, nullable: true })
  sku: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  category: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  brand: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  model: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  color: string | null;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string | null;

  @Index()
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (v?: number | null) => v ?? null,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  price: number | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  stock: number | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  sourceCreatedAt: Date | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  sourceUpdatedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Index()
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
