import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  barcode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  image:
    | {
        id: number;
        url: string;
        isThumbnail: boolean;
      }[]
    | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
  })
  productUrl: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  purchasePrice: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  sellingPrice: string;

  @Column({ type: 'integer', default: 0 })
  stockQuantity: number;

  @Column({ type: 'integer', default: 0 })
  minimumStockThreshold: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
