import { Injectable, Inject } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsResult } from './interfaces/find-products-result.interface';
import { plainToInstance } from 'class-transformer';
import { ProductItemDto } from './dto/product-item.dto';
import { ILoggerService } from '../common/interfaces/logger.interface';
import { IProductsService } from '../common/interfaces/service.interface';
import { LogBusinessOperation } from '../common/decorators/log-method.decorator';
import { SUCCESS_MESSAGES } from '../common/constants';

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  @LogBusinessOperation('products.findAll')
  async findAll(filters: FindProductsQueryDto): Promise<FindProductsResult> {
    this.logger.log('Searching products with filters', {
      context: {
        filters: { ...filters, limit: Math.min(filters.limit || 5, 5) },
        operation: 'products.findAll',
      },
    });

    const offset = Number.isFinite(filters.offset) ? Number(filters.offset) : 0;
    const limit = Math.min(
      Number.isFinite(filters.limit) ? Number(filters.limit) : 5,
      5,
    );

    const { items, total } = await this.repo.search(filters, offset, limit);

    this.logger.debug(`Found ${items.length} products out of ${total}`, {
      context: {
        count: items.length,
        total,
        offset,
        limit,
        operation: 'products.findAll',
      },
    });

    // Aquí transformamos las entidades en DTOs
    const data = plainToInstance(ProductItemDto, items, {
      excludeExtraneousValues: true,
    });

    return { offset, limit, total, data };
  }

  @LogBusinessOperation('products.create')
  async create(dto: CreateProductDto) {
    this.logger.log('Creating new product', {
      context: {
        productName: dto.name,
        sku: dto.sku,
        operation: 'products.create',
      },
    });

    const payload = {
      ...dto,
      sourceCreatedAt: dto.sourceCreatedAt
        ? new Date(dto.sourceCreatedAt)
        : null,
      sourceUpdatedAt: dto.sourceUpdatedAt
        ? new Date(dto.sourceUpdatedAt)
        : null,
    };

    const product = await this.repo.createOne(payload);

    this.logger.log(SUCCESS_MESSAGES.PRODUCT_CREATED, {
      context: {
        productId: product.id,
        productName: product.name,
        operation: 'products.create',
      },
    });

    return product;
  }

  @LogBusinessOperation('products.update')
  async update(id: string, dto: UpdateProductDto) {
    this.logger.log('Updating product', {
      context: { productId: id, fields: Object.keys(dto) },
    });

    // Normalizaciones simples antes de repo (ej: uppercase currency)
    const patch: Record<string, unknown> = { ...dto };
    if (typeof dto.currency === 'string')
      patch.currency = dto.currency.toUpperCase();

    const updated = await this.repo.patchById(id, patch);

    this.logger.log('Product updated successfully', {
      context: { productId: id, updatedFields: Object.keys(dto) },
    });

    return plainToInstance(ProductItemDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  @LogBusinessOperation('products.delete')
  async remove(id: string) {
    this.logger.log('Soft deleting product', {
      context: { productId: id },
    });

    const result = await this.repo.softDeleteById(id);

    this.logger.log('Product deleted successfully', {
      context: { productId: id, deleted: result.deleted },
    });

    return result;
  }
}
