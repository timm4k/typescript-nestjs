import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimText } from '../../common/trim-text.js';

export class ClothesQueryDto {
  @IsOptional()
  @IsUUID('4')
  declare readonly collectionId?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  declare readonly material?: string;

  @IsOptional()
  @IsUUID('4')
  declare readonly materialId?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(150)
  declare readonly search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  readonly page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 10;
}
