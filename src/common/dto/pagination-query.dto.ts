import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
const LIMIT_MAX = 5;

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
  @ApiPropertyOptional({ default: LIMIT_MAX, maximum: LIMIT_MAX })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  limit?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currency?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'CSV: id,name,price,stock,...' })
  @IsOptional()
  @IsString()
  select?: string;
}
