import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncState } from './sync-state.entity';
import { SyncStateRepository } from './sync-state.repository';
import { ProductsRepository } from '../products/products.repository';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SyncState, Product])],
  providers: [SyncService, SyncStateRepository, ProductsRepository],
  exports: [SyncService],
})
export class SyncModule {}
