import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimText } from '../common/trim-text.js';

export class CreateCollectionDto {
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare readonly name: string;
}
