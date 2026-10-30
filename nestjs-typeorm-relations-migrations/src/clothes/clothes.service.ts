import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  type SelectQueryBuilder,
} from 'typeorm';
import { rethrowDatabaseError } from '../common/database-error.js';
import type { ClothesQueryDto } from './dto/clothes-query.dto.js';
import type { CreateClothesDto } from './dto/create-clothes.dto.js';
import type { UpdateClothesDto } from './dto/update-clothes.dto.js';
import { CareInstructionEntity } from './entities/care-instruction.entity.js';
import { ClothingEntity } from './entities/clothing.entity.js';
import { CollectionEntity } from './entities/collection.entity.js';
import { MaterialEntity } from './entities/material.entity.js';

export interface ClothesPage {
  data: ClothingEntity[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const relations = { collection: true, materials: true, careInstruction: true };

@Injectable()
export class ClothesService {
  constructor(
    @InjectRepository(ClothingEntity)
    private readonly repository: Repository<ClothingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private aggregateQuery(): SelectQueryBuilder<ClothingEntity> {
    return this.repository
      .createQueryBuilder('clothing')
      .innerJoinAndSelect('clothing.collection', 'collection')
      .innerJoinAndSelect('clothing.materials', 'material')
      .leftJoinAndSelect('clothing.careInstruction', 'care');
  }

  async findAll(query: ClothesQueryDto): Promise<ClothesPage> {
    const builder = this.aggregateQuery();
    if (query.collectionId !== undefined) {
      builder.andWhere('collection.id = :collectionId', {
        collectionId: query.collectionId,
      });
    }
    if (query.material !== undefined || query.materialId !== undefined) {
      builder.innerJoin('clothing.materials', 'matchedMaterial');
      if (query.material !== undefined) {
        builder.andWhere('LOWER(matchedMaterial.name) = LOWER(:materialName)', {
          materialName: query.material,
        });
      }
      if (query.materialId !== undefined) {
        builder.andWhere('matchedMaterial.id = :materialId', {
          materialId: query.materialId,
        });
      }
    }
    if (query.search !== undefined && query.search.length > 0) {
      builder.andWhere('clothing.title ILIKE :search', {
        search: `%${query.search.replace(/[\\%_]/g, '\\$&')}%`,
      });
    }
    const [data, total] = await builder
      .orderBy('clothing.createdAt', 'DESC')
      .addOrderBy('clothing.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<ClothingEntity> {
    const item = await this.repository.findOne({ where: { id }, relations });
    if (item === null)
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    return item;
  }

  findMaterials(): Promise<MaterialEntity[]> {
    return this.dataSource
      .getRepository(MaterialEntity)
      .find({ order: { name: 'ASC', id: 'ASC' } });
  }

  async findAggregate(id: string): Promise<ClothingEntity> {
    const item = await this.aggregateQuery()
      .where('clothing.id = :id', { id })
      .getOne();
    if (item === null)
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    return item;
  }

  private async findCollection(
    manager: EntityManager,
    id: string,
  ): Promise<CollectionEntity> {
    const collection = await manager.findOneBy(CollectionEntity, { id });
    if (collection === null)
      throw new NotFoundException(`Collection with ID ${id} was not found`);
    return collection;
  }

  private async resolveMaterials(
    manager: EntityManager,
    names: string[],
  ): Promise<MaterialEntity[]> {
    const existing = await manager.findBy(MaterialEntity, { name: In(names) });
    const byName = new Map(
      existing.map((material) => [material.name, material]),
    );
    return names.map(
      (name) => byName.get(name) ?? manager.create(MaterialEntity, { name }),
    );
  }

  async create(
    dto: CreateClothesDto,
    simulateFailure = false,
  ): Promise<ClothingEntity> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const collection = await this.findCollection(manager, dto.collectionId);
        const materials = await this.resolveMaterials(manager, dto.materials);
        const clothing = manager.create(ClothingEntity, {
          title: dto.title,
          price: dto.price.toFixed(2),
          size: dto.size,
          color: dto.color,
          collection,
          materials,
        });
        const saved = await manager.save(clothing);
        if (simulateFailure) {
          throw new BadRequestException(
            'Simulated failure after saving clothing and materials; transaction rolled back',
          );
        }
        const care = manager.create(CareInstructionEntity, {
          ...dto.careInstruction,
          clothing: saved,
        });
        await manager.save(care);
        return manager.findOneOrFail(ClothingEntity, {
          where: { id: saved.id },
          relations,
        });
      });
    } catch (error: unknown) {
      return rethrowDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateClothesDto): Promise<ClothingEntity> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const clothing = await manager.findOne(ClothingEntity, {
          where: { id },
          relations,
        });
        if (clothing === null)
          throw new NotFoundException(`Clothing with ID ${id} was not found`);
        if (dto.title !== undefined) clothing.title = dto.title;
        if (dto.price !== undefined) clothing.price = dto.price.toFixed(2);
        if (dto.size !== undefined) clothing.size = dto.size;
        if (dto.color !== undefined) clothing.color = dto.color;
        if (dto.collectionId !== undefined)
          clothing.collection = await this.findCollection(
            manager,
            dto.collectionId,
          );
        if (dto.materials !== undefined)
          clothing.materials = await this.resolveMaterials(
            manager,
            dto.materials,
          );
        if (dto.careInstruction !== undefined) {
          manager.merge(
            CareInstructionEntity,
            clothing.careInstruction,
            dto.careInstruction,
          );
        }
        await manager.save(clothing);
        return manager.findOneOrFail(ClothingEntity, {
          where: { id },
          relations,
        });
      });
    } catch (error: unknown) {
      return rethrowDatabaseError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
  }
}
