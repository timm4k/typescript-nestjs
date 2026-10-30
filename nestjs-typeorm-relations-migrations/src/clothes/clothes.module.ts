import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClothesController } from './clothes.controller.js';
import { ClothesService } from './clothes.service.js';
import { MaterialsController } from './materials.controller.js';
import { ClothingEntity } from './entities/clothing.entity.js';
import { MaterialEntity } from './entities/material.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ClothingEntity, MaterialEntity])],
  controllers: [ClothesController, MaterialsController],
  providers: [ClothesService],
})
export class ClothesModule {}
