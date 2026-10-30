import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { trimText } from '../../common/trim-text.js';
import { ClothingSize } from '../entities/clothing.entity.js';

export class CreateClothesDto {
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  declare readonly title: string;

  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99_999_999.99)
  declare readonly price: number;

  @IsEnum(ClothingSize)
  declare readonly size: ClothingSize;

  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  declare readonly material: string;

  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare readonly color: string;
}
