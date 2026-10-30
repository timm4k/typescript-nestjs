import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ClothingEntity } from './clothing.entity.js';

@Entity('collections')
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  declare name: string;

  @OneToMany(() => ClothingEntity, (clothing) => clothing.collection)
  declare clothes: Relation<ClothingEntity[]>;
}
