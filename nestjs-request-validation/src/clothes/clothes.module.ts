import { Module } from '@nestjs/common';
import { ClothesController } from './clothes.controller.js';
import { ClothesService } from './clothes.service.js';

@Module({ controllers: [ClothesController], providers: [ClothesService] })
export class ClothesModule {}
