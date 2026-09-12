import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './product.entity.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Post()
  create(@Body() data: Partial<Product>) {
    return this.productsService.create(data);
  }
}
