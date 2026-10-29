import { randomUUID } from 'node:crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { SlugService } from '../shared/slug.service.js';
import type { ClothingEntity } from './clothing.entity.js';
import type { CreateClothesDto } from './dto/create-clothes.dto.js';
import type { UpdateClothesDto } from './dto/update-clothes.dto.js';

@Injectable()
export class ClothesService implements OnModuleInit {
  private readonly items: ClothingEntity[] = [];
  private readonly logger = new Logger(ClothesService.name);

  constructor(private readonly slugService: SlugService) {}

  onModuleInit(): void {
    if (this.items.length > 0) {
      return;
    }
    this.items.push(
      this.buildItem(
        {
          title: 'Sweat Oversized Pullover Hoodie',
          price: 1800,
          size: 'M',
          material: 'Cotton blend',
          color: 'Gray',
        },
        'clothing-1',
      ),
      this.buildItem(
        {
          title: 'AIRism Cotton Oversized T-Shirt',
          price: 950,
          size: 'S',
          material: 'Cotton blend',
          color: 'White',
        },
        'clothing-2',
      ),
    );
    this.logger.log(
      'Module initialization completed | Loaded 2 initial clothing items',
    );
  }

  findAll(): ClothingEntity[] {
    return this.items.map((item) => ({ ...item }));
  }

  findOne(id: string): ClothingEntity {
    const item = this.items.find((entry) => entry.id === id);
    if (item === undefined) {
      throw new NotFoundException(`Clothing with ID ${id} was not found`);
    }
    return { ...item };
  }

  create(dto: CreateClothesDto): ClothingEntity {
    const item = this.buildItem(dto, `clothing-${randomUUID()}`);
    this.items.push(item);
    return { ...item };
  }

  update(id: string, dto: UpdateClothesDto): ClothingEntity {
    const current = this.findOne(id);
    const updated: ClothingEntity = {
      ...current,
      ...dto,
      id: current.id,
      slug:
        dto.title === undefined
          ? current.slug
          : this.slugService.generateSlug(dto.title),
    };
    const index = this.items.findIndex((item) => item.id === id);
    this.items[index] = updated;
    return { ...updated };
  }

  remove(id: string): void {
    this.findOne(id);
    this.items.splice(
      this.items.findIndex((item) => item.id === id),
      1,
    );
  }

  private buildItem(dto: CreateClothesDto, id: string): ClothingEntity {
    return {
      id,
      title: dto.title,
      slug: this.slugService.generateSlug(dto.title),
      price: dto.price,
      size: dto.size,
      material: dto.material,
      color: dto.color,
    };
  }
}
