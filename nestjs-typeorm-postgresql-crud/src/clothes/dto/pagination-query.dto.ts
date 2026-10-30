import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimText } from '../../common/trim-text.js';

export enum ClothesSortField {
  CreatedAt = 'createdAt',
  Title = 'title',
  Price = 'price',
}

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export class PaginationQueryDto {
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

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(150)
  declare readonly search?: string;

  @IsOptional()
  @IsEnum(ClothesSortField)
  readonly sortBy: ClothesSortField = ClothesSortField.CreatedAt;

  @IsOptional()
  @IsEnum(SortDirection)
  readonly order: SortDirection = SortDirection.Desc;
}
