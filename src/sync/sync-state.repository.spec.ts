import { SyncStateRepository } from './sync-state.repository';
import { SyncState } from './sync-state.entity';

describe('SyncStateRepository', () => {
  const baseState: SyncState = {
    id: '1',
    source: 'contentful',
    lastUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SyncState;

  let ormRepo: any;
  let dataSource: any;
  let repository: SyncStateRepository;

  beforeEach(() => {
    ormRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn().mockResolvedValue(baseState),
      create: jest
        .fn()
        .mockImplementation((data) => ({ ...baseState, ...data })),
      save: jest.fn().mockResolvedValue(baseState),
    };

    dataSource = { transaction: jest.fn() };
    repository = new SyncStateRepository(ormRepo, dataSource);
  });

  it('creates sync state when not present', async () => {
    ormRepo.findOne.mockResolvedValueOnce(null);

    const state = await repository.getOrCreate('contentful');

    expect(ormRepo.create).toHaveBeenCalledWith({
      source: 'contentful',
      lastUpdatedAt: null,
    });
    expect(ormRepo.save).toHaveBeenCalled();
    expect(state.source).toBe('contentful');
  });

  it('returns cursor as date or null', async () => {
    ormRepo.findOne.mockResolvedValueOnce({
      ...baseState,
      lastUpdatedAt: new Date('2024-01-01'),
    });
    await expect(repository.getCursor('contentful')).resolves.toEqual(
      new Date('2024-01-01'),
    );

    ormRepo.findOne.mockResolvedValueOnce({
      ...baseState,
      lastUpdatedAt: null,
    });
    await expect(repository.getCursor('contentful')).resolves.toBeNull();
  });

  it('bumps cursor only when candidate is newer', async () => {
    const current = new Date('2024-01-01T00:00:00.000Z');
    const newer = new Date('2024-02-01T00:00:00.000Z');

    const trxRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue({ ...baseState, lastUpdatedAt: current }),
      create: jest.fn().mockReturnValue(baseState),
      save: jest.fn().mockResolvedValue(baseState),
    };
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };

    dataSource.transaction.mockImplementation(async (cb: any) =>
      cb({
        getRepository: () => trxRepo,
        createQueryBuilder: () => qb,
      }),
    );

    await repository.bumpIfLater('contentful', newer);
    expect(qb.execute).toHaveBeenCalled();

    qb.execute.mockClear();
    trxRepo.findOne.mockResolvedValue({ ...baseState, lastUpdatedAt: newer });
    await repository.bumpIfLater('contentful', current);
    expect(qb.execute).not.toHaveBeenCalled();
  });

  it('skips bump when candidate is undefined', async () => {
    await repository.bumpIfLater('contentful', undefined);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
