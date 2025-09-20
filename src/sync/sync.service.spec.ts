import { SyncService } from './sync.service';
import { ConfigService } from '@nestjs/config';
import { ProductsRepository } from '@/products/products.repository';
import { SyncStateRepository } from './sync-state.repository';

jest.mock('../common/services/logger.service', () => ({
  LoggerService: jest.fn(),
}));

jest.mock('./external.client', () => ({
  ContentfulClient: jest.fn(),
}));

import { LoggerService } from '../common/services/logger.service';
import { ContentfulClient } from './external.client';

const LoggerServiceMock = LoggerService as unknown as jest.Mock;
const ContentfulClientMock = ContentfulClient as unknown as jest.Mock;

describe('SyncService', () => {
  let service: SyncService;
  let config: jest.Mocked<ConfigService>;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let syncStateRepo: jest.Mocked<SyncStateRepository>;
  let loggerInstance: any;
  let listProducts: jest.Mock;

  const createConfigMock = (): jest.Mocked<ConfigService> =>
    ({
      get: jest.fn((key: string) => {
        const values: Record<string, any> = {
          SYNC_PAGE_SIZE: 2,
          CONTENTFUL_ENVIRONMENT: 'master',
          CONTENTFUL_CONTENT_TYPE: 'product',
          HTTP_TIMEOUT_MS: 1000,
          HTTP_RETRIES: 1,
        };
        return values[key];
      }),
      getOrThrow: jest.fn((key: string) => {
        const required: Record<string, string> = {
          CONTENTFUL_SPACE_ID: 'space',
          CONTENTFUL_ACCESS_TOKEN: 'token',
        };
        if (!(key in required)) throw new Error(`Missing ${key}`);
        return required[key];
      }),
    }) as unknown as jest.Mocked<ConfigService>;

  const createLoggerMock = () => ({
    operationStart: jest.fn(),
    operationComplete: jest.fn(),
    operationFailed: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    authEvent: jest.fn(),
    apiCall: jest.fn(),
    securityEvent: jest.fn(),
    cacheOperation: jest.fn(),
    performance: jest.fn(),
    validationError: jest.fn(),
    fatal: jest.fn(),
    warn: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    config = createConfigMock();
    productsRepo = {
      upsertFromContentfulSafe: jest.fn(),
    } as unknown as jest.Mocked<ProductsRepository>;
    syncStateRepo = {
      getCursor: jest.fn(),
      bumpIfLater: jest.fn(),
    } as unknown as jest.Mocked<SyncStateRepository>;

    loggerInstance = createLoggerMock();
    LoggerServiceMock.mockImplementation(() => loggerInstance);

    listProducts = jest.fn();
    ContentfulClientMock.mockImplementation(() => ({ listProducts }));

    service = new SyncService(config, productsRepo, syncStateRepo);
  });

  it('processes pages, normalizes entries and updates sync cursor', async () => {
    const entryDate = '2025-09-19T10:00:00.000Z';
    syncStateRepo.getCursor
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(new Date(entryDate));
    listProducts
      .mockResolvedValueOnce({
        total: 2,
        items: [
          {
            sys: {
              id: 'ctf-1',
              updatedAt: entryDate,
              createdAt: '2025-09-10T10:00:00.000Z',
            },
            fields: {
              sku: ' sku-123 ',
              name: '  Fancy Lamp  ',
              category: 'Lighting',
              brand: 'Ácme',
              model: 'L-200',
              color: 'Red',
              currency: 'clp',
              price: '1299.90',
              stock: '12',
            },
          },
        ],
      })
      .mockResolvedValueOnce({ total: 2, items: [] });

    await service.runOnce();

    expect(ContentfulClientMock).toHaveBeenCalledWith({
      spaceId: 'space',
      accessToken: 'token',
      environment: 'master',
      contentType: 'product',
      timeoutMs: 1000,
      retries: 1,
    });
    expect(listProducts).toHaveBeenCalledWith({
      limit: 2,
      skip: 0,
      updatedAtGte: undefined,
    });
    expect(productsRepo.upsertFromContentfulSafe).toHaveBeenCalledWith(
      expect.objectContaining({
        contentfulId: 'ctf-1',
        sku: 'SKU-123',
        name: 'Fancy Lamp',
        currency: 'CLP',
        price: 1299.9,
        stock: 12,
        sourceUpdatedAt: new Date(entryDate),
      }),
    );
    expect(syncStateRepo.bumpIfLater).toHaveBeenCalledWith(
      'contentful:product',
      new Date(entryDate),
    );
    expect(syncStateRepo.getCursor).toHaveBeenCalledTimes(2);
    expect(loggerInstance.operationComplete).toHaveBeenCalled();
    expect(loggerInstance.operationFailed).not.toHaveBeenCalled();
  });

  it('logs and rethrows when repository update fails', async () => {
    syncStateRepo.getCursor.mockResolvedValueOnce(null);
    listProducts.mockResolvedValueOnce({
      total: 1,
      items: [
        {
          sys: {
            id: 'ctf-err',
            updatedAt: '2025-09-19T10:00:00.000Z',
            createdAt: '2025-09-10T10:00:00.000Z',
          },
          fields: { name: 'Broken item' },
        },
      ],
    });
    productsRepo.upsertFromContentfulSafe.mockRejectedValue(new Error('boom'));

    await expect(service.runOnce()).rejects.toThrow('boom');
    expect(loggerInstance.operationFailed).toHaveBeenCalledWith(
      'Contentful sync',
      expect.any(Error),
      expect.any(Number),
      expect.objectContaining({ processed: 0 }),
    );
  });

  it('handleCron delegates to runOnce', async () => {
    jest.spyOn(service, 'runOnce').mockResolvedValueOnce();

    await service.handleCron();

    expect(service.runOnce).toHaveBeenCalled();
  });
});
