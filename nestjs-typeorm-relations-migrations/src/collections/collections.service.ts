import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from '../clothes/entities/collection.entity.js';
import { rethrowDatabaseError } from '../common/database-error.js';
import type { CreateCollectionDto } from './create-collection.dto.js';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly repository: Repository<CollectionEntity>,
  ) {}

  findAll(): Promise<CollectionEntity[]> {
    return this.repository.find({ order: { name: 'ASC', id: 'ASC' } });
  }

  async create(dto: CreateCollectionDto): Promise<CollectionEntity> {
    try {
      return await this.repository.save(
        this.repository.create({ name: dto.name }),
      );
    } catch (error: unknown) {
      return rethrowDatabaseError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Collection with ID ${id} was not found`);
  }
}
