import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SyncState } from './sync-state.entity';

@Injectable()
export class SyncStateRepository {
  constructor(
    @InjectRepository(SyncState) private readonly repo: Repository<SyncState>,
    private readonly ds: DataSource,
  ) {}

  async getOrCreate(source: string): Promise<SyncState> {
    let row = await this.repo.findOne({ where: { source } });
    if (!row) {
      row = this.repo.create({ source, lastUpdatedAt: null });
      try {
        row = await this.repo.save(row);
      } catch (error) {
        console.error('Error saving SyncState:', error);
        row = await this.repo.findOneOrFail({ where: { source } });
      }
    }
    return row;
  }

  async getCursor(source: string): Promise<Date | null> {
    const row = await this.getOrCreate(source);
    return row.lastUpdatedAt ? new Date(row.lastUpdatedAt) : null;
  }

  async bumpIfLater(source: string, candidate?: Date | null): Promise<void> {
    if (!candidate) return;

    await this.ds.transaction(async (trx) => {
      let row = await trx
        .getRepository(SyncState)
        .findOne({ where: { source } });
      if (!row) {
        row = trx
          .getRepository(SyncState)
          .create({ source, lastUpdatedAt: null });
        await trx.getRepository(SyncState).save(row);
      }

      const current = row.lastUpdatedAt ? new Date(row.lastUpdatedAt) : null;
      if (current && current >= candidate) return;

      await trx
        .createQueryBuilder()
        .update(SyncState)
        .set({ lastUpdatedAt: candidate })
        .where('source = :source', { source })
        .andWhere('(lastUpdatedAt IS NULL OR lastUpdatedAt < :cand)', {
          cand: candidate,
        })
        .execute();
    });
  }
}
