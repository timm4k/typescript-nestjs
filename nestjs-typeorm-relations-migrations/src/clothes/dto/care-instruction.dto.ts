import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimText } from '../../common/trim-text.js';

export class CareInstructionDto {
  @IsInt()
  @Min(0)
  @Max(95)
  declare readonly washingTemperature: number;

  @IsBoolean()
  declare readonly dryCleanOnly: boolean;

  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  declare readonly instructions: string;
}
