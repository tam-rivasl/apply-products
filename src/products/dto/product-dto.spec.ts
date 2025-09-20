import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

describe('Product DTO transformations', () => {
  it('normalizes create dto inputs', () => {
    const dto = plainToInstance(CreateProductDto, {
      contentfulId: '  abc  ',
      name: '  Fancy Chair  ',
      sku: ' sku-1 ',
      currency: 'usd',
      price: '199.99',
      stock: '5',
    });

    expect(dto.contentfulId).toBe('abc');
    expect(dto.sku).toBe('SKU-1');
    expect(dto.currency).toBe('USD');
    expect(dto.price).toBeCloseTo(199.99);
    expect(dto.stock).toBe(5);
  });

  it('keeps update dto optional transformations', () => {
    const dto = plainToInstance(UpdateProductDto, {
      name: '  New Name  ',
      currency: 'clp',
      price: '299.5',
      stock: '2',
    });

    expect(dto.name).toBe('New Name');
    expect(dto.currency).toBe('clp');
    expect(dto.price).toBeCloseTo(299.5);
    expect(dto.stock).toBe(2);
  });
});
