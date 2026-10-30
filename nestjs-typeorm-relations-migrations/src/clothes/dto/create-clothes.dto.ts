import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { trimText } from '../../common/trim-text.js';
import { ClothingSize } from '../entities/clothing.entity.js';
import { CareInstructionDto } from './care-instruction.dto.js';

function trimMaterials({ value }: TransformFnParams): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item: unknown) =>
    typeof item === 'string' ? item.trim() : item,
  );
}

export class CreateClothesDto {
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  declare readonly title: string;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99_999_999.99)
  declare readonly price: number;

  @IsEnum(ClothingSize)
  declare readonly size: ClothingSize;

  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare readonly color: string;

  @IsUUID('4')
  declare readonly collectionId: string;

  @Transform(trimMaterials)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(80, { each: true })
  declare readonly materials: string[];

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => CareInstructionDto)
  declare readonly careInstruction: CareInstructionDto;
}
