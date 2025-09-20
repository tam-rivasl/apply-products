import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsNumber,
  MaxLength,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  cleanString,
  normalizeSku,
  normalizeCurrency,
} from '../../common/utils/sanitize';

export class CreateProductDto {
  @ApiProperty({
    description: 'Contentful entry identifier (sys.id)',
    example: '1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  contentfulId: string;

  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  name: string;

  @ApiPropertyOptional({
    description: 'Stock keeping unit (SKU)',
    example: 'IPH15PRO-256-BLK',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => normalizeSku(value))
  sku?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Smartphones',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  category?: string;

  @ApiPropertyOptional({
    description: 'Product brand',
    example: 'Apple',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  brand?: string;

  @ApiPropertyOptional({
    description: 'Product model',
    example: 'iPhone 15 Pro',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  model?: string;

  @ApiPropertyOptional({
    description: 'Product colour',
    example: 'Black',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  color?: string;

  @ApiPropertyOptional({
    description: 'Currency code (e.g. USD, CLP)',
    example: 'USD',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => normalizeCurrency(value))
  currency?: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 999.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({
    description: 'Available stock units',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Source creation timestamp (ISO-8601)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  sourceCreatedAt?: string;

  @ApiPropertyOptional({
    description: 'Source last update timestamp (ISO-8601)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  sourceUpdatedAt?: string;
}
