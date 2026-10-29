import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { ClothingEntity } from './clothing.entity.js';
import { ClothesService } from './clothes.service.js';
import { CreateClothesDto } from './dto/create-clothes.dto.js';
import { UpdateClothesDto } from './dto/update-clothes.dto.js';

@Controller('clothes')
export class ClothesController {
  constructor(private readonly clothesService: ClothesService) {}

  @Get()
  findAll(): ClothingEntity[] {
    return this.clothesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): ClothingEntity {
    return this.clothesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClothesDto): ClothingEntity {
    return this.clothesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClothesDto,
  ): ClothingEntity {
    return this.clothesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.clothesService.remove(id);
  }
}
