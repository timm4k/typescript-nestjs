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
import { ClothesQueryDto } from './dto/clothes-query.dto.js';
import { CreateClothesDto } from './dto/create-clothes.dto.js';
import { TransactionalClothesDto } from './dto/transactional-clothes.dto.js';
import { UpdateClothesDto } from './dto/update-clothes.dto.js';
import type { ClothingEntity } from './entities/clothing.entity.js';

@Controller('clothes')
export class ClothesController {
  constructor(private readonly clothes: ClothesService) {}

  @Get()
  findAll(@Query() query: ClothesQueryDto): Promise<ClothesPage> {
    return this.clothes.findAll(query);
  }

  @Get(':id/aggregate')
  findAggregate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClothingEntity> {
    return this.clothes.findAggregate(id);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClothingEntity> {
    return this.clothes.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClothesDto): Promise<ClothingEntity> {
    return this.clothes.create(dto);
  }

  @Post('transactional')
  @HttpCode(HttpStatus.CREATED)
  createTransactional(
    @Body() dto: TransactionalClothesDto,
  ): Promise<ClothingEntity> {
    return this.clothes.create(dto, dto.simulateFailure ?? false);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateClothesDto,
  ): Promise<ClothingEntity> {
    return this.clothes.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.clothes.remove(id);
  }
}
