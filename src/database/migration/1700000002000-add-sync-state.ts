import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSyncState1700000000800 implements MigrationInterface {
  name = 'CreateSyncState1700000000800';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS "sync_state" (
                                                "source" varchar(100) PRIMARY KEY,
        "lastUpdatedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
        );
    `);

    await q.query(
      `CREATE INDEX IF NOT EXISTS "idx_sync_state_updatedAt" ON "sync_state"("updatedAt");`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "idx_sync_state_updatedAt";`);
    await q.query(`DROP TABLE IF EXISTS "sync_state";`);
  }
}
