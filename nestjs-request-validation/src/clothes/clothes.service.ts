import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ClothingSize,
  type ClothesListResponse,
  type ClothingEntity,
} from './clothing.entity.js';
import type { CreateClothesDto } from './dto/create-clothes.dto.js';
import type { UpdateClothesDto } from './dto/update-clothes.dto.js';

@Injectable()
export class ClothesService {
  private readonly items: ClothingEntity[] = [
    {
      id: '1',
      title: 'Sweat Oversized Pullover Hoodie',
      price: 1800,
      size: ClothingSize.M,
      material: 'Cotton blend',
      color: 'Gray',
    },
    {
      id: '2',
      title: 'AIRism Cotton Oversized T-Shirt',
      price: 950,
      size: ClothingSize.S,
      material: 'Cotton blend',
      color: 'White',
    },
    {
      id: '3',
      title: 'Sweat Wide Pants',
      price: 2100,
      size: ClothingSize.XS,
      material: 'Cotton blend',
      color: 'Gray',
    },
  ];

  findAll(limit: number = 10): ClothesListResponse {
    return {
      items: this.items.slice(0, limit).map((item) => ({ ...item })),
      meta: { total: this.items.length, limit },
    };
  }

  findOne(id: string): ClothingEntity {
    const item = this.items.find((entry) => entry.id === id);
    if (item === undefined) {
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    }
    return { ...item };
  }

  create(dto: CreateClothesDto): ClothingEntity {
    const item: ClothingEntity = {
      id: randomUUID(),
      title: dto.title,
      price: dto.price,
      size: dto.size,
      material: dto.material,
      color: dto.color,
    };
    this.items.push(item);
    return { ...item };
  }

  update(id: string, dto: UpdateClothesDto): ClothingEntity {
    const current = this.findOne(id);
    const updated: ClothingEntity = {
      id: current.id,
      title: dto.title ?? current.title,
      price: dto.price ?? current.price,
      size: dto.size ?? current.size,
      material: dto.material ?? current.material,
      color: dto.color ?? current.color,
    };
    this.items[this.items.findIndex((item) => item.id === id)] = updated;
    return { ...updated };
  }

  remove(id: string): void {
    this.findOne(id);
    this.items.splice(
      this.items.findIndex((item) => item.id === id),
      1,
    );
  }
}
