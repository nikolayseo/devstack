import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity.js';
import { SearchService } from '../search/search.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PRODUCT_INDEXING_QUEUE } from '../indexing/indexing.constants.js';

@Injectable()
export class ProductsService {
  private readonly INDEX = 'products';

  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly searchService: SearchService,
    @InjectQueue(PRODUCT_INDEXING_QUEUE) private readonly indexingQueue: Queue,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async create(data: Partial<Product>) {
    const product = this.repo.create(data);
    const saved = await this.repo.save(product);

    await this.indexingQueue.add('index-product', {
      id: saved.id,
      name: saved.name,
      category: saved.category,
      price: saved.price,
    });

    return saved;
  }

  async search(query: string) {
    return this.searchService.search(this.INDEX, query);
  }
}
