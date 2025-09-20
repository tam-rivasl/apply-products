import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ILoggerService } from '@/common/interfaces/logger.interface';
import { SUCCESS_MESSAGES } from '@/common/constants';
import { FindProductsQueryDto } from './dto/find-products-query.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;
  let logger: jest.Mocked<ILoggerService>;

  const createRepositoryMock = (): jest.Mocked<ProductsRepository> =>
    ({
      search: jest.fn(),
      createOne: jest.fn(),
      patchById: jest.fn(),
      softDeleteById: jest.fn(),
      findActiveByIdOrThrow: jest.fn(),
      // TypeORM base members that may be accessed implicitly
    }) as unknown as jest.Mocked<ProductsRepository>;

  const createLoggerMock = (): jest.Mocked<ILoggerService> => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
    operationStart: jest.fn(),
    operationComplete: jest.fn(),
    operationFailed: jest.fn(),
    dbOperation: jest.fn(),
    apiCall: jest.fn(),
    authEvent: jest.fn(),
    securityEvent: jest.fn(),
    performance: jest.fn(),
    validationError: jest.fn(),
    cacheOperation: jest.fn(),
    child: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: createRepositoryMock(),
        },
        {
          provide: 'ILoggerService',
          useValue: createLoggerMock(),
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    repository = module.get(
      ProductsRepository,
    ) as jest.Mocked<ProductsRepository>;
    logger = module.get('ILoggerService') as jest.Mocked<ILoggerService>;
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('caps the requested limit to 5 and maps entities into DTOs', async () => {
      const now = new Date();
      repository.search.mockResolvedValue({
        items: [
          {
            id: 'p-1',
            contentfulId: 'ctf-1',
            name: 'Gaming Laptop',
            price: 1299,
            stock: 4,
            createdAt: now,
            updatedAt: now,
          },
        ],
        total: 1,
      } as any);

      const result = await service.findAll({
        limit: 25,
        offset: 2,
      } as FindProductsQueryDto);

      expect(repository.search).toHaveBeenCalledWith(
        { limit: 25, offset: 2 },
        2,
        5,
      );
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(2);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'p-1',
        name: 'Gaming Laptop',
      });
      expect(result.data[0].createdAt).toBeInstanceOf(Date);
      expect(logger.log).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('defaults offset to 0 when missing', async () => {
      repository.search.mockResolvedValue({ items: [], total: 0 } as any);

      const result = await service.findAll({} as FindProductsQueryDto);

      expect(repository.search).toHaveBeenCalledWith({}, 0, 5);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(5);
    });
  });

  describe('create', () => {
    it('delegates to repository and logs success', async () => {
      const dto = { contentfulId: 'ctf-2', name: 'Phone', sku: 'P-001' };
      const saved = {
        ...dto,
        id: 'p-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      repository.createOne.mockResolvedValue(saved);

      const result = await service.create(dto as any);

      expect(repository.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          contentfulId: dto.contentfulId,
          name: dto.name,
          sku: dto.sku,
          sourceCreatedAt: null,
          sourceUpdatedAt: null,
        }),
      );
      expect(result).toBe(saved);
      expect(logger.log).toHaveBeenCalledWith(
        SUCCESS_MESSAGES.PRODUCT_CREATED,
        expect.any(Object),
      );
    });
  });

  describe('update', () => {
    it('uppercases currency and returns transformed DTO', async () => {
      const updated = {
        id: 'p-3',
        contentfulId: 'ctf-3',
        name: 'Desk lamp',
        currency: 'usd',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.patchById.mockResolvedValue({
        ...updated,
        currency: 'USD',
      } as any);

      const result = await service.update('p-3', { currency: 'usd' } as any);

      expect(repository.patchById).toHaveBeenCalledWith('p-3', {
        currency: 'USD',
      });
      expect(result.currency).toBe('USD');
      expect(result).toMatchObject({ id: 'p-3', name: 'Desk lamp' });
    });
  });

  describe('remove', () => {
    it('delegates to repository soft delete', async () => {
      repository.softDeleteById.mockResolvedValue({ id: 'p-4', deleted: true });

      const result = await service.remove('p-4');

      expect(repository.softDeleteById).toHaveBeenCalledWith('p-4');
      expect(result).toEqual({ id: 'p-4', deleted: true });
    });
  });
});
