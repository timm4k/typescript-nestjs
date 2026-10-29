import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module.js';
import { ClothesController } from './clothes.controller.js';
import { ClothesService } from './clothes.service.js';

@Module({
  imports: [SharedModule],
  controllers: [ClothesController],
  providers: [ClothesService],
  exports: [ClothesService],
})
export class ClothesModule {}
