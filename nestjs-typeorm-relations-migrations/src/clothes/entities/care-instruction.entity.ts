import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ClothingEntity } from './clothing.entity.js';

@Entity('care_instructions')
export class CareInstructionEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'integer' })
  declare washingTemperature: number;

  @Column({ type: 'boolean', default: false })
  declare dryCleanOnly: boolean;

  @Column({ type: 'varchar', length: 500 })
  declare instructions: string;

  @OneToOne(() => ClothingEntity, (clothing) => clothing.careInstruction, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clothing_id' })
  declare clothing: Relation<ClothingEntity>;
}
