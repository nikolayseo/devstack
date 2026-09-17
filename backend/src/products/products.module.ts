import { Module } from '@nestjs/common';
import { IndexingModule } from '../indexing/indexing.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), IndexingModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
