import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity.js';
import { SearchService } from '../search/search.service.js';
import { OutboxEvent } from '../outbox/outbox-event.entity.js';

@Injectable()
export class ProductsService {
  private readonly INDEX = 'products';

  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly searchService: SearchService,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async create(data: Partial<Product>) {
    return this.dataSource.transaction(async (manager) => {
      const product = manager.create(Product, data);
      const saved = await manager.save(Product, product);

      await manager.save(OutboxEvent, {
        id: crypto.randomUUID(),
        eventType: 'product.created',
        aggregateType: 'product',
        aggregateId: String(saved.id),
        payload: {
          id: saved.id,
          name: saved.name,
          category: saved.category,
          price: saved.price,
        },
        publishedAt: null,
      });

      return saved;
    });
  }

  async search(query: string) {
    return this.searchService.search(this.INDEX, query);
  }
}
