import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { LoggerService } from '../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [
    ProductsRepository, 
    ProductsService,
    {
      provide: 'ILoggerService',
      useClass: LoggerService,
    },
  ],
  controllers: [ProductsController],
  exports: [ProductsRepository, ProductsService],
})
export class ProductsModule {}
