import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SyncStateRepository } from './sync-state.repository';
import { CtfEntry, CtfProductFields } from './types/contentful';
import { LoggerService } from '../common/services/logger.service';
import { LogBusinessOperation } from '../common/decorators/log-method.decorator';

// 👇 importa tus helpers
import {
  cleanString,
  toNumberOrNull,
  toIntOrNull,
  normalizeCurrency,
  normalizeSku,
  normalizeNameOrNull,
} from '@/common/utils/sanitize';
import { ContentfulClient } from './external.client';
import { ProductsRepository } from '@/products/products.repository';

@Injectable()
export class SyncService {
  private readonly appLogger: LoggerService;
  private readonly client: ContentfulClient;
  private readonly pageSize: number;

  constructor(
    private readonly config: ConfigService,
    private readonly productsRepo: ProductsRepository,
    private readonly syncStateRepo: SyncStateRepository,
  ) {
    this.appLogger = new LoggerService(this.config);
    this.client = new ContentfulClient({
      spaceId: this.config.getOrThrow<string>('CONTENTFUL_SPACE_ID'),
      accessToken: this.config.getOrThrow<string>('CONTENTFUL_ACCESS_TOKEN'),
      environment:
        this.config.get<string>('CONTENTFUL_ENVIRONMENT') ?? 'master',
      contentType:
        this.config.get<string>('CONTENTFUL_CONTENT_TYPE') ?? 'product',
      timeoutMs: Number(this.config.get('HTTP_TIMEOUT_MS') ?? 15000),
      retries: Number(this.config.get('HTTP_RETRIES') ?? 3),
    });
    this.pageSize = Number(this.config.get('SYNC_PAGE_SIZE') ?? 100);
  }

  @Cron(process.env.SYNC_CRON || CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.runOnce();
  }

  @LogBusinessOperation('sync.contentful.runOnce')
  async runOnce() {
    const sourceKey = 'contentful:product';
    const since = await this.syncStateRepo.getCursor(sourceKey);
    const sinceIso = since ? since.toISOString() : undefined;

    this.appLogger.operationStart('Contentful sync', {
      sourceKey,
      since: sinceIso,
      pageSize: this.pageSize,
    });

    let skip = 0;
    let processed = 0;
    let maxUpdated: Date | null = since ?? null;
    const startTime = Date.now();

    try {
      for (;;) {
        const page = await this.client.listProducts({
          limit: this.pageSize,
          skip,
          updatedAtGte: sinceIso,
        });

        if (!page.items?.length) break;

        this.appLogger.debug(
          `Processing page ${Math.floor(skip / this.pageSize) + 1}`,
          {
            context: {
              skip,
              pageSize: this.pageSize,
              itemsInPage: page.items.length,
              total: page.total,
            },
          },
        );

        for (const entry of page.items) {
          await this.applyEntry(entry);
          processed++;
          const u = new Date(entry.sys.updatedAt);
          if (!maxUpdated || u > maxUpdated) maxUpdated = u;
        }

        skip += page.items.length;
        if (skip >= page.total) break;
      }

      await this.syncStateRepo.bumpIfLater(sourceKey, maxUpdated ?? undefined);
      const cursor = await this.syncStateRepo.getCursor(sourceKey);
      const duration = Date.now() - startTime;

      this.appLogger.operationComplete('Contentful sync', duration, {
        processed,
        lastUpdatedAt: cursor?.toISOString(),
        maxUpdated: maxUpdated?.toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.appLogger.operationFailed(
        'Contentful sync',
        error as Error,
        duration,
        {
          processed,
          skip,
        },
      );
      throw error;
    }
  }

  private async applyEntry(entry: CtfEntry<CtfProductFields>) {
    const f = entry.fields || ({} as CtfProductFields);

    this.appLogger.debug('Processing Contentful entry', {
      context: {
        contentfulId: entry.sys.id,
        name: f.name,
        updatedAt: entry.sys.updatedAt,
      },
    });

    const payload = {
      contentfulId: entry.sys.id,
      // Strings "opcionales" → undefined/null acorde a tus columnas NULLable
      sku: normalizeSku(f.sku) ?? null,
      name: normalizeNameOrNull(f.name) ?? '(sin nombre)',
      category: cleanString(f.category) ?? null,
      brand: cleanString(f.brand) ?? null,
      model: cleanString(f.model) ?? null,
      color: cleanString(f.color) ?? null,
      // Currency en upper validada (devuelve undefined si no aplica; lo pasamos a null si columna es NULLable)
      currency: normalizeCurrency(f.currency) ?? null,
      // Números: null si no vienen o no son parseables
      price: toNumberOrNull(f.price),
      stock: toIntOrNull(f.stock),
      // Fechas source
      sourceCreatedAt: entry.sys.createdAt
        ? new Date(entry.sys.createdAt)
        : null,
      sourceUpdatedAt: entry.sys.updatedAt
        ? new Date(entry.sys.updatedAt)
        : null,
    };

    try {
      await this.productsRepo.upsertFromContentfulSafe(payload);

      this.appLogger.debug('Contentful entry processed successfully', {
        context: {
          contentfulId: entry.sys.id,
          name: payload.name,
          sku: payload.sku,
        },
      });
    } catch (error) {
      this.appLogger.error('Failed to process Contentful entry', {
        error: error as Error,
        context: {
          contentfulId: entry.sys.id,
          name: f.name,
        },
      });
      throw error;
    }
  }
}
