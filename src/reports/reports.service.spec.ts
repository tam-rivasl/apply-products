import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';

describe('ReportsService', () => {
  const dataSource = { query: jest.fn() } as any;
  let service: ReportsService;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2025-09-20T12:00:00.000Z') });
    jest.clearAllMocks();
    service = new ReportsService(dataSource);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('overview', () => {
    it('aggregates metrics and computes percentages', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ total: 4 }])
        .mockResolvedValueOnce([{ cnt: 1 }])
        .mockResolvedValueOnce([{ priced: 3, nprice: 1 }])
        .mockResolvedValueOnce([{ min: 10, max: 40, avg: 25 }]);

      const query: ReportsQueryDto = {
        from: '2025-09-01T00:00:00.000Z',
        to: '2025-09-20T00:00:00.000Z',
        dateField: 'createdAt',
        brand: 'Acme',
      } as ReportsQueryDto;

      const result = await service.overview(query);

      expect(result).toEqual({
        total: 4,
        deletedCount: 1,
        deletedPct: 25,
        pricedCount: 3,
        pricedPct: 75,
        noPriceCount: 1,
        noPricePct: 25,
        priceMin: 10,
        priceMax: 40,
        priceAvg: 25,
      });
      expect(dataSource.query).toHaveBeenCalledTimes(4);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM products'),
        expect.arrayContaining(['2025-09-01T00:00:00.000Z', '2025-09-20T00:00:00.000Z']),
      );
    });

    it('throws on invalid dateField', async () => {
      await expect(
        service.overview({ from: '2024-01-01', to: '2024-01-02', dateField: 'invalid' as any }),
      ).rejects.toThrow('Invalid dateField');
      expect(dataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('byCategory', () => {
    it('maps rows to typed breakdown', async () => {
      dataSource.query.mockResolvedValueOnce([
        { category: 'Laptops', total: '3' },
        { category: null, total: 2 },
      ]);

      const breakdown = await service.byCategory({ from: '2025-09-10T00:00:00.000Z', to: '2025-09-20T00:00:00.000Z' } as ReportsQueryDto);

      expect(breakdown).toEqual([
        { category: 'Laptops', total: 3 },
        { category: null, total: 2 },
      ]);
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('internal helpers', () => {
    it('coerceRange defaults to 30 days when missing', () => {
      const { from, to } = (service as any).coerceRange({} as ReportsQueryDto);
      expect(new Date(to).toISOString()).toBe('2025-09-20T12:00:00.000Z');
      expect(new Date(from)).toBeInstanceOf(Date);
      expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
    });

    it('coerceRange validates ordering', () => {
      expect(() =>
        (service as any).coerceRange({ from: '2025-09-10T00:00:00.000Z', to: '2025-09-09T00:00:00.000Z' }),
      ).toThrow('"from" must be <= "to"');
    });

    it('buildFilters produces positional parameters', () => {
      const filters = (service as any).buildFilters({ brand: 'Logi', color: 'Black' });
      expect(filters.sql.trim()).toContain('AND');
      expect(filters.args).toEqual(['Logi', 'Black']);
    });
  });
});
