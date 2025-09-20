import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { Product } from './entities/product.entity';
const EDITABLE_FIELDS = new Set([
  'name',
  'category',
  'brand',
  'model',
  'color',
  'currency',
  'sku',
  'price',
  'stock',
]);
type UpsertPayload = {
  contentfulId: string;
  sku?: string | null;
  name: string;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  currency?: string | null;
  price?: number | null;
  stock?: number | null;
  sourceCreatedAt?: Date | null;
  sourceUpdatedAt?: Date | null;
};
@Injectable()
export class ProductsRepository extends Repository<Product> {
  constructor(private readonly ds: DataSource) {
    super(Product, ds.createEntityManager());
  }

  async search(filters: FindProductsQueryDto, offset = 0, limit = 5) {
    const qb = this.createQueryBuilder('p').where('p.deletedAt IS NULL');

    if (filters.name)
      qb.andWhere(
        'immutable_unaccent(p.name) ILIKE immutable_unaccent(:name)',
        {
          name: `%${filters.name}%`,
        },
      );

    const eq = (col: string, val?: string) => {
      if (val)
        qb.andWhere(
          `LOWER(immutable_unaccent(p.${col})) = LOWER(immutable_unaccent(:${col}))`,
          {
            [col]: val,
          },
        );
    };
    eq('category', filters.category);
    eq('brand', filters.brand);
    eq('model', filters.model);
    eq('color', filters.color);
    eq('currency', filters.currency);
    eq('sku', filters.sku);

    if (filters.price !== undefined)
      qb.andWhere('p.price = :price', { price: filters.price });
    if (filters.priceMin !== undefined)
      qb.andWhere('p.price >= :priceMin', { priceMin: filters.priceMin });
    if (filters.priceMax !== undefined)
      qb.andWhere('p.price <= :priceMax', { priceMax: filters.priceMax });
    if (filters.stock !== undefined)
      qb.andWhere('p.stock = :stock', { stock: filters.stock });

    // ⬇️ SELECT DINÁMICO SIN HARDCODE
    if (filters.select?.length) {
      const meta = this.manager.connection.getMetadata(Product); // o this.ds.getMetadata(Product)
      const allowed = new Set(meta.columns.map((c) => c.propertyName));

      const requested = filters.select.filter((col) => allowed.has(col));
      if (requested.length) {
        const selects = requested.map((prop) => {
          const col = meta.findColumnWithPropertyName(prop);
          return `p.${col?.propertyPath ?? prop}`;
        });
        qb.select(selects);
      }
      // Si ninguna columna solicitada es válida, no aplicamos select (devuelve todas).
    }

    const [items, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip(offset)
      .take(Math.min(limit ?? 5, 5))
      .getManyAndCount();

    return { items, total };
  }
  async softDeleteById(id: string): Promise<{ id: string; deleted: boolean }> {
    // set deletedAt solo si no está ya borrado
    const res = await this.createQueryBuilder()
      .update(Product)
      .set({ deletedAt: () => 'now()' })
      .where('id = :id', { id })
      .andWhere('deletedAt IS NULL')
      .returning(['id'])
      .execute();

    if (res.affected === 0) {
      // no existe o ya estaba borrado
      throw new NotFoundException('Product not found');
    }
    return { id: res.raw[0].id as string, deleted: true };
  }

  async createOne(dto: Partial<Product>) {
    const entity = this.create(dto);
    return this.save(entity);
  }

  async findActiveByIdOrThrow(id: string): Promise<Product> {
    const row = await this.createQueryBuilder('p')
      .where('p.id = :id', { id })
      .andWhere('p.deletedAt IS NULL')
      .getOne();
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  async patchById(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Product> {
    // filtra solo campos permitidos y descarta undefined
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch || {})) {
      if (v === undefined) continue;
      if (EDITABLE_FIELDS.has(k)) data[k] = v;
    }
    if (Object.keys(data).length === 0) {
      // nada que actualizar: devuelve el actual si existe
      return this.findActiveByIdOrThrow(id);
    }

    // asegura que existe y está activo
    await this.findActiveByIdOrThrow(id);

    // actualiza y retorna con RETURNING
    const updated = await this.createQueryBuilder()
      .update(Product)
      .set({ ...data, updatedAt: () => 'now()' })
      .where('id = :id', { id })
      .andWhere('deletedAt IS NULL')
      .returning('*')
      .execute();

    if (!updated.raw?.[0]) throw new NotFoundException('Product not found');
    return updated.raw[0] as Product;
  }
  async upsertFromContentfulSafe(p: UpsertPayload): Promise<void> {
    await this.ds.transaction(async (trx) => {
      // 1) UPDATE primero (solo si no está soft-deleted)
      const upd = await trx
        .createQueryBuilder()
        .update(Product)
        .set({
          sku: p.sku ?? null,
          name: p.name,
          category: p.category ?? null,
          brand: p.brand ?? null,
          model: p.model ?? null,
          color: p.color ?? null,
          currency: p.currency ?? null,
          price: p.price ?? null,
          stock: p.stock ?? null,
          sourceUpdatedAt: p.sourceUpdatedAt ?? null,
          updatedAt: () => 'now()',
        })
        .where('contentfulId = :contentfulId', { contentfulId: p.contentfulId })
        .andWhere('deletedAt IS NULL')
        .execute();

      if (upd.affected && upd.affected > 0) return; // actualizado ✅

      // 2) Si no actualizó, intentamos insert (no reactiva si ya existía soft-deleted)
      await trx
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values({
          contentfulId: p.contentfulId,
          sku: p.sku ?? null,
          name: p.name,
          category: p.category ?? null,
          brand: p.brand ?? null,
          model: p.model ?? null,
          color: p.color ?? null,
          currency: p.currency ?? null,
          price: p.price ?? null,
          stock: p.stock ?? null,
          sourceCreatedAt: p.sourceCreatedAt ?? null,
          sourceUpdatedAt: p.sourceUpdatedAt ?? null,
        })
        .orIgnore() // ON CONFLICT DO NOTHING
        .execute();
    });
  }
}
