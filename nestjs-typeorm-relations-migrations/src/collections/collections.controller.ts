import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CollectionsService } from './collections.service.js';
import { CreateCollectionDto } from './create-collection.dto.js';
import type { CollectionEntity } from '../clothes/entities/collection.entity.js';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  findAll(): Promise<CollectionEntity[]> {
    return this.collections.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCollectionDto): Promise<CollectionEntity> {
    return this.collections.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.collections.remove(id);
  }
}
