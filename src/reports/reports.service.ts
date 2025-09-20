import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportsQueryDto, DateField } from './dto/reports-query.dto';

/**
 * Shape of the “overview” aggregate report.
 * All ratios are returned as percentages in [0..100] with 2 decimals.
 */
export type OverviewReport = {
  /** Count of products considered in the time window (based on `dateField`) */
  total: number;

  /** Count and percentage of products that were soft-deleted in the time window (based on `deletedAt`) */
  deletedCount: number;
  deletedPct: number;

  /** Count and percentage of products with price != NULL in the time window */
  pricedCount: number;
  pricedPct: number;

  /** Count and percentage of products with price == NULL in the time window */
  noPriceCount: number;
  noPricePct: number;

  /** Price stats computed ONLY for items with non-null price in the time window */
  priceMin: number | null;
  priceMax: number | null;
  priceAvg: number | null;
};

/**
 * Category breakdown. You can replace this with other “report at will”
 * like price buckets without touching the service interface.
 */
export type CategoryBreakdown = Array<{
  category: string | null;
  total: number;
}>;

/**
 * Mapping of allowed report time columns to concrete SQL projection.
 * We never interpolate user input directly: `dateField` is whitelisted by DTO.
 */
const ALLOWED_DATE_FIELDS: Record<DateField, string> = {
  createdAt: '"products"."createdAt"',
  updatedAt: '"products"."updatedAt"',
  deletedAt: '"products"."deletedAt"',
  sourceUpdatedAt: '"products"."sourceUpdatedAt"',
};

/**
 * ReportsService
 *
 * Pure aggregation layer over the "products" table. It:
 * - Applies a time window on a chosen date column (`dateField`) for the report “universe”.
 * - Computes soft-deletes using `deletedAt` in the same window (independent from the chosen `dateField`).
 * - Computes priced/no-price splits and price stats (min/max/avg) on-the-fly; nothing is stored.
 * - Accepts optional product filters (category, brand, model, color, currency), normalized with unaccent/LOWER.
 *
 * Design notes:
 * - No business logic in controllers. This service exposes a minimal surface and uses parameterized queries only.
 * - We rely on DB indexes (btree on category/brand/model/color/currency and GIN(trgm) for name if needed).
 * - All SQL is idempotent and safe; no schema mutations here.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly ds: DataSource) {}

  /**
   * Overview report:
   * - Universe: products with {dateField} BETWEEN [from, to].
   * - Deleted: products with deletedAt BETWEEN [from, to] (independent from dateField).
   * - Split priced / noPrice within the same universe.
   * - Price stats computed on price != NULL within the universe.
   *
   * @param q Unified query DTO (date range + optional filters).
   * @returns Aggregated counts and percentages with price stats.
   */
  async overview(q: ReportsQueryDto): Promise<OverviewReport> {
    const { from, to } = this.coerceRange(q);
    const dateField: DateField = q.dateField ?? 'updatedAt';
    if (!(dateField in ALLOWED_DATE_FIELDS)) {
      throw new Error('Invalid dateField');
    }
    const dateCol = ALLOWED_DATE_FIELDS[dateField];
    const whereBase = this.buildFilters(q);

    // 1) Universe total by selected date column
    const totalRow = await this.ds.query(
      `
      SELECT COUNT(*)::int AS total
      FROM products
      WHERE ${dateCol} BETWEEN $1 AND $2
        ${whereBase.sql}
      `,
      [from, to, ...whereBase.args],
    );
    const total: number = totalRow[0]?.total ?? 0;

    // 2) Deleted (always by deletedAt within the same [from, to])
    const deletedRow = await this.ds.query(
      `
      SELECT COUNT(*)::int AS cnt
      FROM products
      WHERE "products"."deletedAt" IS NOT NULL
        AND "products"."deletedAt" BETWEEN $1 AND $2
        ${whereBase.sql}
      `,
      [from, to, ...whereBase.args],
    );
    const deletedCount: number = deletedRow[0]?.cnt ?? 0;

    // 3) Priced / noPrice split in the same universe
    const pricedRow = await this.ds.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE price IS NOT NULL)::int AS priced,
        COUNT(*) FILTER (WHERE price IS NULL)::int  AS nprice
      FROM products
      WHERE ${dateCol} BETWEEN $1 AND $2
        ${whereBase.sql}
      `,
      [from, to, ...whereBase.args],
    );
    const pricedCount = pricedRow[0]?.priced ?? 0;
    const noPriceCount = pricedRow[0]?.nprice ?? 0;

    // 4) Price stats (only non-null price)
    const statsRow = await this.ds.query(
      `
      SELECT
        MIN(price)::float AS min,
        MAX(price)::float AS max,
        AVG(price)::float AS avg
      FROM products
      WHERE ${dateCol} BETWEEN $1 AND $2
        ${whereBase.sql}
        AND price IS NOT NULL
      `,
      [from, to, ...whereBase.args],
    );
    const priceMin = statsRow[0]?.min ?? null;
    const priceMax = statsRow[0]?.max ?? null;
    const priceAvg = statsRow[0]?.avg ?? null;

    // 5) Percentages (guard against division by zero)
    const pct = (num: number, den: number) =>
      den > 0 ? +((num * 100) / den).toFixed(2) : 0;
    const deletedPct = pct(deletedCount, total);
    const pricedPct = pct(pricedCount, total);
    const noPricePct = pct(noPriceCount, total);

    return {
      total,
      deletedCount,
      deletedPct,
      pricedCount,
      pricedPct,
      noPriceCount,
      noPricePct,
      priceMin,
      priceMax,
      priceAvg,
    };
  }

  /**
   * Report at will (example): category breakdown.
   * Counts products grouped by category in the given time window and optional filters.
   *
   * Replaceable: If you prefer price buckets or brand breakdown, implement here and
   * keep the controller route unchanged (only response schema changes).
   *
   * @param q Unified query DTO (date range + optional filters).
   * @returns Array of { category, total } sorted by total desc.
   */
  async byCategory(q: ReportsQueryDto): Promise<CategoryBreakdown> {
    const { from, to } = this.coerceRange(q);
    const dateCol = ALLOWED_DATE_FIELDS[q.dateField ?? 'updatedAt'];
    const whereBase = this.buildFilters(q);

    const rows = await this.ds.query(
      `
      SELECT category, COUNT(*)::int AS total
      FROM products
      WHERE ${dateCol} BETWEEN $1 AND $2
        ${whereBase.sql}
      GROUP BY category
      ORDER BY total DESC NULLS LAST, category ASC NULLS FIRST
      `,
      [from, to, ...whereBase.args],
    );

    return rows.map((r: any) => ({
      category: r.category ?? null,
      total: Number(r.total),
    }));
  }

  // ─────────────────────────────── helpers ───────────────────────────────

  /**
   * Coerce the incoming optional range into an ISO window.
   * Defaults to the last 30 days if nothing is provided.
   *
   * Invariants:
   * - Returned values are valid ISO datetimes.
   * - Throws if from > to or invalid dates are provided.
   */
  private coerceRange(q: ReportsQueryDto): { from: string; to: string } {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 3600 * 1000); // last 30 days

    const from = q.from ? new Date(q.from) : defaultFrom;
    const to = q.to ? new Date(q.to) : now;

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new Error('Invalid date range: from/to must be ISO-8601 datetimes');
    }
    if (from > to) {
      throw new Error('"from" must be <= "to"');
    }

    return { from: from.toISOString(), to: to.toISOString() };
  }

  /**
   * Builds safe filter predicates for category/brand/model/color/currency.
   * Each equality is performed with LOWER(immutable_unaccent(col)) for accent/case-insensitive matching.
   *
   * Returns:
   *  - sql: string to append (starting with " AND ..." or empty)
   *  - args: ordered positional parameters to append after [from, to]
   *
   * Important:
   * - We never interpolate user inputs directly; everything goes through positional params.
   * - Name search (free text) is intentionally excluded here. Use a dedicated search endpoint if needed.
   */
  private buildFilters(q: ReportsQueryDto): { sql: string; args: any[] } {
    const clauses: string[] = [];
    const args: any[] = [];

    const eq = (col: 'category' | 'brand' | 'model' | 'color' | 'currency') => {
      const v = q[col];
      if (v) {
        // $1 and $2 are taken by [from, to]; the first filter param starts at $3
        const paramIndex = args.length + 3;
        clauses.push(
          `LOWER(immutable_unaccent("products"."${col}")) = LOWER(immutable_unaccent($${paramIndex}))`,
        );
        args.push(v);
      }
    };

    eq('category');
    eq('brand');
    eq('model');
    eq('color');
    eq('currency');

    return { sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '', args };
  }
}
