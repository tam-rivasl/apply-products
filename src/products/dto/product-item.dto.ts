// product-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class ProductItemDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() contentfulId: string;
  @ApiProperty({ required: false, nullable: true }) @Expose() sku?:
    | string
    | null;
  @ApiProperty() @Expose() name: string;
  @ApiProperty({ required: false, nullable: true }) @Expose() category?:
    | string
    | null;
  @ApiProperty({ required: false, nullable: true }) @Expose() brand?:
    | string
    | null;
  @ApiProperty({ required: false, nullable: true }) @Expose() model?:
    | string
    | null;
  @ApiProperty({ required: false, nullable: true }) @Expose() color?:
    | string
    | null;
  @ApiProperty({ required: false, nullable: true }) @Expose() currency?:
    | string
    | null;
  @ApiProperty({ required: false, nullable: true, type: Number })
  @Expose()
  @Transform(({ value }) =>
    value === undefined ? undefined : value == null ? null : Number(value),
  )
  price?: number | null;
  @ApiProperty({ required: false, nullable: true, type: Number })
  @Expose()
  @Transform(({ value }) =>
    value === undefined ? undefined : value == null ? null : Number(value),
  )
  stock?: number | null;
  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  sourceUpdatedAt?: Date | null;
  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
