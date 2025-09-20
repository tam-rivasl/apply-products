import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';
import { FindProductsQueryDto } from '@/products/dto/find-products-query.dto';

describe('PaginationQueryDto', () => {
  it('normalizes pagination parameters and select array', () => {
    const dto = plainToInstance(PaginationQueryDto, {
      offset: '3',
      limit: 10,
      select: ['name', 'price', 'name'],
    });

    expect(dto.offset).toBe(3);
    expect(dto.limit).toBe(5);
    expect(dto.select).toEqual(['name', 'price']);
  });

  it('cleans product filters', () => {
    const dto = plainToInstance(FindProductsQueryDto, {
      name: '  Laptop  ',
      category: '  Office  ',
      stock: '5',
    });

    expect(dto.name).toBe('Laptop');
    expect(dto.category).toBe('Office');
    expect(dto.stock).toBe(5);
  });
});
