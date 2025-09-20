import { ProductItemDto } from '../dto/product-item.dto';

export interface FindProductsResult {
  offset: number;
  limit: number;
  total: number;
  data: ProductItemDto[];
}
