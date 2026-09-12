import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity.js';
import { SearchService } from '../search/search.service.js';

@Injectable()
export class ProductsService {
  private readonly INDEX = 'products';

  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly searchService: SearchService,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async create(data: Partial<Product>) {
    const product = this.repo.create(data);
    const saved = await this.repo.save(product);

    await this.searchService.index(this.INDEX, String(saved.id), {
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
