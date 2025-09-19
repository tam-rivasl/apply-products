import { SelectQueryBuilder } from 'typeorm';
import { Product } from '../../../../entities/product.entity';
import { FindProductsQueryDto } from '../../../../dto/find-products-query.dto';
//TODO: agregar las demas columnas de products
export class ProductsQueryBuilder {
  static build(qb: SelectQueryBuilder<Product>, filters: FindProductsQueryDto) {
    qb.where('p.deleted = false');

    if (filters.name)
      qb.andWhere('unaccent(p.name) ILIKE unaccent(:name)', {
        name: `%${filters.name}%`,
      });
    if (filters.category)
      qb.andWhere('LOWER(unaccent(p.category)) = LOWER(unaccent(:category))', {
        category: filters.category,
      });
    if (filters.brand)
      qb.andWhere('LOWER(unaccent(p.brand)) = LOWER(unaccent(:brand))', {
        brand: filters.brand,
      });
    if (filters.color)
      qb.andWhere('LOWER(unaccent(p.color)) = LOWER(unaccent(:color))', {
        color: filters.color,
      });

    // No existen min/max columnas: sólo filtros de rango cuando vienen en query
    if (filters.minPrice !== undefined)
      qb.andWhere('p.price >= :minPrice', { minPrice: filters.minPrice });
    if (filters.maxPrice !== undefined)
      qb.andWhere('p.price <= :maxPrice', { maxPrice: filters.maxPrice });
    if (filters.minStock !== undefined)
      qb.andWhere('p.stock >= :minStock', { minStock: filters.minStock });
    if (filters.maxStock !== undefined)
      qb.andWhere('p.stock <= :maxStock', { maxStock: filters.maxStock });

    return qb;
  }
}
