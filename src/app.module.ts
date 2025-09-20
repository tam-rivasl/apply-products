import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // <-- importante
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // App
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),

        // Auth
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),

        // DB (conexión por parámetros)
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().allow('').required(),
        DB_NAME: Joi.string().required(),

        // Contentful
        CONTENTFUL_SPACE_ID: Joi.string().required(),
        CONTENTFUL_ACCESS_TOKEN: Joi.string().required(),
        CONTENTFUL_ENVIRONMENT: Joi.string().default('master'),
        CONTENTFUL_CONTENT_TYPE: Joi.string().required(),

        // Sync & HTTP
        SYNC_CRON: Joi.string().default('0 * * * *'),
        SYNC_PAGE_SIZE: Joi.number().default(100),
        HTTP_TIMEOUT_MS: Joi.number().default(15000),
        HTTP_RETRIES: Joi.number().default(3),

        // Logging
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'log', 'debug', 'verbose')
          .default('log'),
        LOG_RESPONSE_BODY: Joi.boolean().default(false),
      }),
    }),

    // TypeORM via parámetros individuales
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
      }),
    }),

    CommonModule,
    AuthModule,
    ProductsModule,
    SyncModule,
    ReportsModule,
  ],
})
export class AppModule {}
