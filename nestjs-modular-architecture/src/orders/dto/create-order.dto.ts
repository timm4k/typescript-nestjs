import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { trimText } from '../../shared/validation/trim-text.js';

export class CreateOrderDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 64)
  declare readonly productId: string;

  @IsInt()
  @Min(1)
  @Max(10_000)
  declare readonly quantity: number;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(trimText)
  @IsEmail()
  @MaxLength(254)
  declare readonly customerEmail?: string;
}
