import { IsBoolean, IsOptional } from 'class-validator';
import { CreateClothesDto } from './create-clothes.dto.js';

export class TransactionalClothesDto extends CreateClothesDto {
  @IsOptional()
  @IsBoolean()
  declare readonly simulateFailure?: boolean;
}
