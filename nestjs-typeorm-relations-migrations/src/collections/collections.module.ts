import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionEntity } from '../clothes/entities/collection.entity.js';
import { CollectionsController } from './collections.controller.js';
import { CollectionsService } from './collections.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionEntity])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
