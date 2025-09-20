import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtensionsAndIndexes1700000001000
  implements MigrationInterface
{
  name = 'AddExtensionsAndIndexes1700000001000';

  public async up(q: QueryRunner): Promise<void> {
    // Extensiones necesarias
    await q.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Función IMMUTABLE que envuelve unaccent(text)
    // Nota: Postgres permite declarar IMMUTABLE funciones SQL aunque llamen funciones STABLE.
    // Es nuestra "promesa" para poder usarla en índices.
    await q.query(`
      CREATE OR REPLACE FUNCTION immutable_unaccent(text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      PARALLEL SAFE
      AS $$
        SELECT unaccent($1)::text
      $$;
    `);

    // Índice trigram sobre nombre sin acentos (para ILIKE + unaccent eficientes)
    await q.query(`
      CREATE INDEX IF NOT EXISTS "products_name_unaccent_trgm"
      ON "products"
      USING GIN ( (immutable_unaccent(name)) gin_trgm_ops );
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "products_name_unaccent_trgm";`);
    await q.query(`DROP FUNCTION IF EXISTS immutable_unaccent(text);`);
    await q.query(
      `-- Nota: dejamos las extensiones instaladas (no las removemos en down por seguridad)`,
    );
  }
}
