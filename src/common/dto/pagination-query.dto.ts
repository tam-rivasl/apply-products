// src/common/dto/pagination-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsArray } from 'class-validator';

function parseSelectGeneric(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const cleaned = raw.map((v) => String(v).trim()).filter(Boolean);
  // quita duplicados
  return Array.from(new Set(cleaned));
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @Transform(({ value }) => (Number.isFinite(+value) ? Number(value) : 0))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset: number = 0;

  @ApiPropertyOptional({ default: 5, maximum: 5 })
  @Transform(({ value }) => {
    const n = Number.isFinite(+value) ? Number(value) : 5;
    return Math.min(Math.max(n, 1), 5);
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  limit: number = 5;

  // ⬇️ NUEVO: select opcional (ej: ?select=name,brand o ?select=name&select=brand)
  @ApiPropertyOptional({
    description:
      'Columnas a devolver (propiedades de la entidad). Ej: select=name,brand,price',
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => parseSelectGeneric(value))
  @IsArray()
  @IsOptional()
  select?: string[];
}
