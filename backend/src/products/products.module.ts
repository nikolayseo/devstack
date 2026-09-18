import { Module } from '@nestjs/common';
import { IndexingModule } from '../indexing/indexing.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { KafkaModule } from '../kafka/kafka.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), IndexingModule, AuthModule, KafkaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
