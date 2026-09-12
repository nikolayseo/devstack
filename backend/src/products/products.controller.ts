import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './product.entity.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  create(@Body() data: Partial<Product>) {
    return this.productsService.create(data);
  }
}
