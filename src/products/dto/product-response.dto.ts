import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ProductResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  contentfulId: string;

  @ApiProperty()
  @Expose()
  sku: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  brand: string;

  @ApiProperty()
  @Expose()
  model: string;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiProperty()
  @Expose()
  color: string;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiProperty()
  @Expose()
  currency: string;

  @ApiProperty()
  @Expose()
  stock: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value.toISOString())
  contentfulCreatedAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value.toISOString())
  contentfulUpdatedAt: Date;
}
