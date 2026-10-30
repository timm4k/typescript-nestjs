import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ILike,
  Repository,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from 'typeorm';
import type { CreateClothesDto } from './dto/create-clothes.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import type { UpdateClothesDto } from './dto/update-clothes.dto.js';
import { ClothingEntity } from './entities/clothing.entity.js';

export interface ClothesPage {
  data: ClothingEntity[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class ClothesService {
  constructor(
    @InjectRepository(ClothingEntity)
    private readonly repository: Repository<ClothingEntity>,
  ) {}

  async create(dto: CreateClothesDto): Promise<ClothingEntity> {
    const item = this.repository.create({
      ...dto,
      price: dto.price.toFixed(2),
    });
    return this.repository.save(item);
  }

  async findAll(
    query: PaginationQueryDto = new PaginationQueryDto(),
  ): Promise<ClothesPage> {
    const { page, limit, sortBy, order: direction } = query;
    const search = query.search ?? '';
    const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
    const where: FindOptionsWhere<ClothingEntity> =
      search.length === 0 ? {} : { title: ILike(`%${escapedSearch}%`) };
    const order: FindOptionsOrder<ClothingEntity> = {
      [sortBy]: direction,
      id: direction,
    };
    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<ClothingEntity> {
    const item = await this.repository.findOneBy({ id });
    if (item === null) {
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateClothesDto): Promise<ClothingEntity> {
    const item = await this.findOne(id);
    const { price, ...details } = dto;
    this.repository.merge(item, {
      ...details,
      ...(price === undefined ? {} : { price: price.toFixed(2) }),
    });
    return this.repository.save(item);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<ClothingEntity> {
    const item = await this.repository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (item === null) {
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    }
    if (item.deletedAt !== null) {
      await this.repository.restore(id);
    }
    return this.findOne(id);
  }
}
