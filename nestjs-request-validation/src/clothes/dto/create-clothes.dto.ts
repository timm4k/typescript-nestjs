import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { ClothingSize } from '../clothing.entity.js';

export class CreateClothesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  declare readonly title: string;

  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  declare readonly price: number;

  @IsEnum(ClothingSize)
  declare readonly size: ClothingSize;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  declare readonly material: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  declare readonly color: string;
}
