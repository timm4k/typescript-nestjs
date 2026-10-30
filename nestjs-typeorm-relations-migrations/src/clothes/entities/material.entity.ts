import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ClothingEntity } from './clothing.entity.js';

@Entity('materials')
export class MaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  declare name: string;

  @ManyToMany(() => ClothingEntity, (clothing) => clothing.materials)
  declare clothes: Relation<ClothingEntity[]>;
}
