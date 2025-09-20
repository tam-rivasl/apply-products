import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { Product } from './products/entities/product.entity';
import { SyncState } from './sync/sync-state.entity';

const fileExtension = __filename.endsWith('.ts') ? 'ts' : 'js';
const migrationsGlob = path.resolve(
  __dirname,
  'database',
  'migration',
  `*.${fileExtension}`,
);

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Product, SyncState],
  migrations: [migrationsGlob],
  synchronize: false,
  logging: ['error', 'warn'],
  migrationsTransactionMode: 'each',
  applicationName: 'apply-products',
  maxQueryExecutionTime: 2000,
  extra: {
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    max: Number(process.env.DB_POOL_MAX ?? 10),
  },
  ssl: /^true$/i.test(process.env.DB_SSL ?? 'false')
    ? { rejectUnauthorized: false }
    : false,
});
