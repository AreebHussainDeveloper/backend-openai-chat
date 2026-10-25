import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductImageDto } from './product-image.dto.js';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'WH-1000XM5', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ example: '0123456789012', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode: string;

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  image?: ProductImageDto[];

  @ApiPropertyOptional({ example: 'Electronics', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'Sony', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'WH-1000XM5', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({ example: '/products/wireless-headphones' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  productUrl: string;

  @ApiProperty({ example: 249.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 349.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 25, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity = 0;

  @ApiProperty({ example: 5, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStockThreshold = 0;
}
