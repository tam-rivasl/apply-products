import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsNumber,
  MaxLength,
  IsUUID,
  IsDateString,
  IsIn,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { cleanString, normalizeSku, normalizeCurrency } from '../../common/utils/sanitize';

export class CreateProductDto {
  @ApiProperty({ 
    description: 'Contentful sys.id',
    example: '1234567890abcdef'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  contentfulId: string;

  @ApiProperty({ 
    description: 'Nombre del producto',
    example: 'iPhone 15 Pro',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  name: string;

  @ApiPropertyOptional({ 
    description: 'SKU del producto',
    example: 'IPH15PRO-256-BLK',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => normalizeSku(value))
  sku?: string;

  @ApiPropertyOptional({ 
    description: 'Categoría del producto',
    example: 'Smartphones',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Marca del producto',
    example: 'Apple',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  brand?: string;

  @ApiPropertyOptional({ 
    description: 'Modelo del producto',
    example: 'iPhone 15 Pro',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  model?: string;

  @ApiPropertyOptional({ 
    description: 'Color del producto',
    example: 'Black',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => cleanString(value))
  color?: string;

  @ApiPropertyOptional({ 
    description: 'Moneda del precio',
    example: 'USD',
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => normalizeCurrency(value))
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Precio del producto',
    example: 999.99,
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ 
    description: 'Stock disponible',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ 
    description: 'Fecha de creación en el sistema fuente',
    example: '2024-01-15T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  sourceCreatedAt?: Date;

  @ApiPropertyOptional({ 
    description: 'Fecha de última actualización en el sistema fuente',
    example: '2024-01-15T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  sourceUpdatedAt?: Date;
}
