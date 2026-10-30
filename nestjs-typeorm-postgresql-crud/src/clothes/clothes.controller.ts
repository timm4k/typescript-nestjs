import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClothesService, type ClothesPage } from './clothes.service.js';
import { CreateClothesDto } from './dto/create-clothes.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { UpdateClothesDto } from './dto/update-clothes.dto.js';
import type { ClothingEntity } from './entities/clothing.entity.js';

@Controller('clothes')
export class ClothesController {
  constructor(private readonly clothesService: ClothesService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<ClothesPage> {
    return this.clothesService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClothingEntity> {
    return this.clothesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClothesDto): Promise<ClothingEntity> {
    return this.clothesService.create(dto);
  }

  @Patch(':id/restore')
  restore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClothingEntity> {
    return this.clothesService.restore(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateClothesDto,
  ): Promise<ClothingEntity> {
    return this.clothesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.clothesService.remove(id);
  }
}
