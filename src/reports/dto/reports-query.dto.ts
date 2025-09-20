import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { cleanString } from '@/common/utils/sanitize';

export const DATE_FIELDS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'sourceUpdatedAt',
] as const;
export type DateField = (typeof DATE_FIELDS)[number];

export class ReportsQueryDto {
  // Range
  @ApiPropertyOptional({
    description: 'Inclusive start of the window (ISO-8601)',
    example: '2025-09-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end of the window (ISO-8601)',
    example: '2025-09-20T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    description: 'Date column to constrain the window',
    enum: DATE_FIELDS,
    default: 'updatedAt',
  })
  @IsOptional()
  @IsIn(DATE_FIELDS as unknown as string[])
  @Transform(({ value }) =>
    (DATE_FIELDS as readonly string[]).includes(value) ? value : 'updatedAt',
  )
  dateField?: DateField = 'updatedAt';

  // Optional product filters (accent/case-insensitive)
  @ApiPropertyOptional({ description: 'Exact match (normalized) by category' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => cleanString(value))
  category?: string;

  @ApiPropertyOptional({ description: 'Exact match (normalized) by brand' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => cleanString(value))
  brand?: string;

  @ApiPropertyOptional({ description: 'Exact match (normalized) by model' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => cleanString(value))
  model?: string;

  @ApiPropertyOptional({ description: 'Exact match (normalized) by color' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => cleanString(value))
  color?: string;

  @ApiPropertyOptional({
    description: 'Exact match (normalized) by currency (e.g., CLP, USD)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => cleanString(value))
  currency?: string;
}
