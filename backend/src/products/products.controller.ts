import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './create-product.dto.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все товары' })
  @ApiResponse({ status: 200, description: 'Список товаров' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск товаров' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос', type: String })
  @ApiResponse({ status: 200, description: 'Результаты поиска' })
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Post()
  @ApiOperation({ summary: 'Создать товар' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Товар создан' })
  create(@Body() data: CreateProductDto) {
    return this.productsService.create(data);
  }
}
