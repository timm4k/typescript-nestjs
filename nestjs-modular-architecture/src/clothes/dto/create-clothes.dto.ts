import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsString, Length, Max, Min } from 'class-validator';
import { clothingSizes, type ClothingSize } from '../clothing.entity.js';
import { trimText } from '../../shared/validation/trim-text.js';

export class CreateClothesDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 120)
  declare readonly title: string;

  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  declare readonly price: number;

  @IsIn(clothingSizes)
  declare readonly size: ClothingSize;

  @Transform(trimText)
  @IsString()
  @Length(1, 80)
  declare readonly material: string;

  @Transform(trimText)
  @IsString()
  @Length(1, 80)
  declare readonly color: string;
}
