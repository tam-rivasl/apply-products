import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1700000000500 implements MigrationInterface {
  name = 'CreateProducts1700000000500';

  public async up(q: QueryRunner): Promise<void> {
    // extensiones mínimas para UUID por si no existieran (pgcrypto)
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contentfulId" varchar(200) NOT NULL,
        "sku" varchar(200),
        "name" varchar(200) NOT NULL,
        "category" varchar(200),
        "brand" varchar(200),
        "model" varchar(200),
        "color" varchar(200),
        "currency" varchar(50),
        "price" numeric,
        "stock" int,
        "sourceCreatedAt" timestamptz,
        "sourceUpdatedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      );
    `);

    // Unicidades/índices básicos de columnas
    await q.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uniq_products_contentfulid" ON "products"("contentfulId");`,
    );
    await q.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uniq_products_sku_not_null" ON "products"("sku") WHERE "sku" IS NOT NULL;`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_createdAt"   ON "products"("createdAt");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_updatedAt"   ON "products"("updatedAt");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_deletedAt"   ON "products"("deletedAt");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_category"    ON "products"("category");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_brand"       ON "products"("brand");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_model"       ON "products"("model");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_color"       ON "products"("color");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_currency"    ON "products"("currency");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_price"       ON "products"("price");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_stock"       ON "products"("stock");`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_source_upd"  ON "products"("sourceUpdatedAt");`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "idx_products_source_upd";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_stock";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_price";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_currency";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_color";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_model";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_brand";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_category";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_deletedAt";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_updatedAt";`);
    await q.query(`DROP INDEX IF EXISTS "idx_products_createdAt";`);
    await q.query(`DROP INDEX IF EXISTS "uniq_products_sku_not_null";`);
    await q.query(`DROP INDEX IF EXISTS "uniq_products_contentfulid";`);
    await q.query(`DROP TABLE IF EXISTS "products";`);
  }
}
