import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService, OverviewReport, CategoryBreakdown } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  const service = {
    overview: jest.fn(),
    byCategory: jest.fn(),
  } as Partial<ReportsService> as jest.Mocked<ReportsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(ReportsController);
    jest.clearAllMocks();
  });

  it('returns overview report from service', async () => {
    const report: OverviewReport = {
      total: 10,
      deletedCount: 1,
      deletedPct: 10,
      pricedCount: 6,
      pricedPct: 60,
      noPriceCount: 4,
      noPricePct: 40,
      priceMin: 10,
      priceMax: 100,
      priceAvg: 55,
    };
    service.overview.mockResolvedValue(report);

    await expect(controller.overview({} as any)).resolves.toBe(report);
    expect(service.overview).toHaveBeenCalledWith({});
  });

  it('returns category breakdown from service', async () => {
    const breakdown: CategoryBreakdown = [
      { category: 'Phones', total: 4 },
      { category: null, total: 1 },
    ];
    service.byCategory.mockResolvedValue(breakdown);

    await expect(controller.byCategory({ currency: 'USD' } as any)).resolves.toBe(breakdown);
    expect(service.byCategory).toHaveBeenCalledWith({ currency: 'USD' });
  });
});
