import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 16', description: 'Название товара' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'electronics', description: 'Категория товара' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 999, description: 'Цена товара' })
  @IsNumber()
  @Min(0)
  price: number;
}
