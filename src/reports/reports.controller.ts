import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ReportsService,
  OverviewReport,
  CategoryBreakdown,
} from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import { JwtAuthGuard } from '@/auth/jwt.guard';

@ApiTags('Private: Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('overview')
  @ApiOkResponse({
    description:
      'Summary KPIs in the given window: soft-deleted %, priced %, unpriced %, price stats.',
    schema: {
      example: {
        total: 120,
        deletedCount: 8,
        deletedPct: 6.67,
        pricedCount: 100,
        pricedPct: 83.33,
        noPriceCount: 20,
        noPricePct: 16.67,
        priceMin: 12990,
        priceMax: 1999900,
        priceAvg: 349990.5,
      },
    },
  })
  overview(@Query() q: ReportsQueryDto): Promise<OverviewReport> {
    return this.service.overview(q);
  }

  @Get('by-category')
  @ApiOkResponse({
    description: 'Category breakdown for the given window.',
    schema: {
      example: [
        { category: 'Laptops', total: 55 },
        { category: 'Monitors', total: 22 },
        { category: null, total: 3 },
      ],
    },
  })
  byCategory(@Query() q: ReportsQueryDto): Promise<CategoryBreakdown> {
    return this.service.byCategory(q);
  }
}
