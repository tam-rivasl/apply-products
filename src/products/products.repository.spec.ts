import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.entity';

describe('ProductsRepository', () => {
  let repo: ProductsRepository;
  let dataSource: any;
  const baseState = { id: '1', contentfulId: '1', name: 'Item', createdAt: new Date(), updatedAt: new Date() } as any;
  const metadata = {
    columns: ['name', 'category', 'brand', 'model', 'color', 'currency', 'sku']
      .map((propertyName) => ({ propertyName, propertyPath: propertyName })),
    findColumnWithPropertyName(prop: string) {
      return this.columns.find((c: any) => c.propertyName === prop) ?? null;
    },
  };

  beforeEach(() => {
    const entityManager = { connection: { getMetadata: () => metadata } };
    dataSource = {
      createEntityManager: () => entityManager,
      transaction: jest.fn(),
    };
    repo = new ProductsRepository(dataSource);
    Object.assign(repo, { manager: entityManager });
  });

  it('builds search query with filters and select', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' }], 1]),
    };
    jest.spyOn(repo as any, 'createQueryBuilder').mockReturnValue(qb);

    const result = await repo.search({ name: 'Lap', brand: 'Dell', select: ['name', 'unknown'] } as any, 0, 5);

    expect(qb.andWhere).toHaveBeenCalled();
    expect(qb.select).toHaveBeenCalledWith(['p.name']);
    expect(result).toEqual({ items: [{ id: '1' }], total: 1 });
  });

  it('soft deletes product and throws when not found', async () => {
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1, raw: [{ id: '1' }] }),
    };
    jest.spyOn(repo as any, 'createQueryBuilder').mockReturnValue(qb);

    await expect(repo.softDeleteById('1')).resolves.toEqual({ id: '1', deleted: true });
    qb.execute.mockResolvedValue({ affected: 0 });
    await expect(repo.softDeleteById('missing')).rejects.toThrow('Product not found');
  });

  it('patches product fields and reuses findActiveByIdOrThrow', async () => {
    jest.spyOn(repo, 'findActiveByIdOrThrow').mockResolvedValue({ id: '1' } as Product);
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: [{ id: '1', name: 'Updated' }] }),
    };
    jest.spyOn(repo as any, 'createQueryBuilder').mockReturnValue(qb);

    const patched = await repo.patchById('1', { name: 'Updated', invalid: 'ignored' });
    expect(qb.set).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
    expect(patched).toEqual({ id: '1', name: 'Updated' });
  });

  it('upserts contentful payload within transaction', async () => {
    const updateBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    const insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };

    (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb({
      getRepository: () => ({
        findOne: jest.fn().mockResolvedValue({ ...baseState, lastUpdatedAt: null }),
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockResolvedValue({}),
      }),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(updateBuilder)
        .mockReturnValueOnce(insertBuilder),
    }));

    await repo.upsertFromContentfulSafe({ contentfulId: '1', name: 'Item' } as any);
    expect(updateBuilder.execute).toHaveBeenCalled();
    expect(insertBuilder.execute).toHaveBeenCalled();
  });
});
