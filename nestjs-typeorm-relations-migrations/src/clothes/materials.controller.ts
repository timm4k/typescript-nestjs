import { Controller, Get } from '@nestjs/common';
import type { MaterialEntity } from './entities/material.entity.js';
import { ClothesService } from './clothes.service.js';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly clothes: ClothesService) {}

  @Get()
  findAll(): Promise<MaterialEntity[]> {
    return this.clothes.findMaterials();
  }
}
