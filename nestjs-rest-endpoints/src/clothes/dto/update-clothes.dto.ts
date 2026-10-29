import { PartialType } from '@nestjs/mapped-types';
import { CreateClothesDto } from './create-clothes.dto.js';

export class UpdateClothesDto extends PartialType(CreateClothesDto, {
  skipNullProperties: false,
}) {}
