import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClothesController } from './clothes.controller.js';
import { ClothesService } from './clothes.service.js';
import { ClothingEntity } from './entities/clothing.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ClothingEntity])],
  controllers: [ClothesController],
  providers: [ClothesService],
})
export class ClothesModule {}
