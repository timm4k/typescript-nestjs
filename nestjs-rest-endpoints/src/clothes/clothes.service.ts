import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Clothing } from './clothing.entity.js';
import type { CreateClothesDto } from './dto/create-clothes.dto.js';
import type { UpdateClothesDto } from './dto/update-clothes.dto.js';

const maximumLimit = 1000;
const maximumSearchLength = 120;

@Injectable()
export class ClothesService {
  private readonly items: Clothing[] = [
    {
      id: '1',
      title: 'Sweat Oversized Pullover Hoodie',
      price: 1800,
      size: 'M',
      material: 'Cotton blend',
      color: 'Gray',
    },
    {
      id: '2',
      title: 'AIRism Cotton Oversized T-Shirt',
      price: 950,
      size: 'S',
      material: 'Cotton blend',
      color: 'White',
    },
    {
      id: '3',
      title: 'Sweat Wide Pants',
      price: 2100,
      size: 'XS',
      material: 'Cotton blend',
      color: 'Gray',
    },
  ];

  findAll(search?: string, limit?: string): Clothing[] {
    if (
      search !== undefined &&
      (typeof search !== 'string' || search.length > maximumSearchLength)
    ) {
      throw new BadRequestException(
        `Search must be a string of at most ${maximumSearchLength} characters`,
      );
    }
    let count: number | undefined;
    if (limit !== undefined) {
      if (typeof limit !== 'string' || !/^[0-9]+$/.test(limit)) {
        throw new BadRequestException(
          `Limit must be an integer between 1 and ${maximumLimit}`,
        );
      }
      count = Number(limit);
      if (!Number.isSafeInteger(count) || count < 1 || count > maximumLimit) {
        throw new BadRequestException(
          `Limit must be an integer between 1 and ${maximumLimit}`,
        );
      }
    }
    const normalizedSearch = search?.trim().toLowerCase() ?? '';
    const matches = this.items.filter((item) =>
      item.title.toLowerCase().includes(normalizedSearch),
    );
    return matches.slice(0, count).map((item) => ({ ...item }));
  }

  findOne(id: string): Clothing {
    const item = this.items.find((entry) => entry.id === id);
    if (item === undefined) {
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    }
    return { ...item };
  }

  create(dto: CreateClothesDto): Clothing {
    const item: Clothing = {
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

  update(id: string, dto: UpdateClothesDto): Clothing {
    const current = this.findOne(id);
    const updated: Clothing = { ...current, ...dto, id: current.id };
    const index = this.items.findIndex((item) => item.id === id);
    this.items[index] = updated;
    return { ...updated };
  }

  remove(id: string): void {
    this.findOne(id);
    const index = this.items.findIndex((item) => item.id === id);
    this.items.splice(index, 1);
  }
}
