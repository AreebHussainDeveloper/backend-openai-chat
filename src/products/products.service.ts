import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ErrorCodes } from '../common/constants/error-codes.enum.js';
import { ErrorMessages } from '../common/constants/error-messages.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './entities/product.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private validateThumbnail(images: CreateProductDto['image']): void {
    const thumbnailCount =
      images?.filter((image) => image.isThumbnail).length ?? 0;

    if (thumbnailCount > 1) {
      throw new BadRequestException(
        ErrorMessages[ErrorCodes.MULTIPLE_PRODUCT_THUMBNAILS],
      );
    }
  }

  private withThumbnail(product: Product) {
    const { image, ...productData } = product;

    return {
      ...productData,
      thumbnail: image?.find((item) => item.isThumbnail)?.url ?? null,
    };
  }

  async create(dto: CreateProductDto) {
    this.validateThumbnail(dto.image);

    const product = this.productRepository.create({
      name: dto.name,
      sku: dto.sku,
      barcode: dto.barcode ?? null,
      image: dto.image ?? null,
      productUrl: dto.productUrl ?? null,
      category: dto.category ?? null,
      brand: dto.brand ?? null,
      model: dto.model ?? null,
      purchasePrice: dto.purchasePrice.toFixed(2),
      sellingPrice: dto.sellingPrice.toFixed(2),
      stockQuantity: dto.stockQuantity,
      minimumStockThreshold: dto.minimumStockThreshold,
    });

    try {
      const savedProduct = await this.productRepository.save(product);
      return this.withThumbnail(savedProduct);
    } catch (error) {
      this.throwIfDuplicateProductValue(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    this.validateThumbnail(dto.image);

    const { purchasePrice, sellingPrice, ...productUpdates } = dto;

    Object.assign(product, productUpdates);

    if (purchasePrice !== undefined) {
      product.purchasePrice = String(purchasePrice);
    }

    if (sellingPrice !== undefined) {
      product.sellingPrice = String(sellingPrice);
    }

    try {
      const savedProduct = await this.productRepository.save(product);
      return this.withThumbnail(savedProduct);
    } catch (error) {
      this.throwIfDuplicateProductValue(error);
      throw error;
    }
  }

  async delete(id: number) {
    const result = await this.productRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted successfully' };
  }

  private throwIfDuplicateProductValue(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(
        'SKU, barcode, or product URL already exists',
      );
    }
  }
  async getWebsiteProducts() {
    const products = await this.productRepository.find({
      select: {
        id: true,
        name: true,
        image: true,
        category: true,
        brand: true,
        sellingPrice: true,
        productUrl: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return products.map((product) => this.withThumbnail(product));
  }

  async getDashboardProducts() {
    const products = await this.productRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return products.map((product) => this.withThumbnail(product));
  }
}
