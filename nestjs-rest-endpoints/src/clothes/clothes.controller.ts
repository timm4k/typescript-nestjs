import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Clothing } from './clothing.entity.js';
import { ClothesService } from './clothes.service.js';
import { CreateClothesDto } from './dto/create-clothes.dto.js';
import { UpdateClothesDto } from './dto/update-clothes.dto.js';

@Controller('clothes')
export class ClothesController {
  constructor(private readonly clothesService: ClothesService) {}

  @Get()
  @Header('X-API-Version', '1.0')
  @Header('X-Service-Status', 'operational')
  findAll(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Clothing[] {
    return this.clothesService.findAll(search, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Clothing {
    return this.clothesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClothesDto): Clothing {
    return this.clothesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClothesDto): Clothing {
    return this.clothesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.clothesService.remove(id);
  }
}
