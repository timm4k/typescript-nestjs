import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ClothingSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

@Entity('clothes')
@Check('CHK_clothes_price_positive', '"price" > 0')
export class ClothingEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 150 })
  declare title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare price: string;

  @Column({ type: 'enum', enum: ClothingSize, enumName: 'clothing_size' })
  declare size: ClothingSize;

  @Column({ type: 'varchar', length: 80 })
  declare material: string;

  @Column({ type: 'varchar', length: 50 })
  declare color: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  declare createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  declare updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  declare deletedAt: Date | null;
}
