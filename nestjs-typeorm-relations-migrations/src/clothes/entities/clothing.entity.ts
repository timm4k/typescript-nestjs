import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { CollectionEntity } from './collection.entity.js';
import { MaterialEntity } from './material.entity.js';
import { CareInstructionEntity } from './care-instruction.entity.js';

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

  @Column({ type: 'varchar', length: 50 })
  declare color: string;

  @ManyToOne(() => CollectionEntity, (collection) => collection.clothes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collection_id' })
  declare collection: Relation<CollectionEntity>;

  @ManyToMany(() => MaterialEntity, (material) => material.clothes, {
    cascade: true,
  })
  @JoinTable({
    name: 'clothing_materials',
    joinColumn: { name: 'clothing_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'material_id', referencedColumnName: 'id' },
  })
  declare materials: Relation<MaterialEntity[]>;

  @OneToOne(() => CareInstructionEntity, (care) => care.clothing, {
    cascade: ['insert', 'update'],
  })
  declare careInstruction: Relation<CareInstructionEntity>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  declare createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  declare updatedAt: Date;
}
