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
import { SuccessCodes } from '../common/constants/success-codes.enum.js';
import { SuccessMessages } from '../common/constants/success-messages.js';
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
      visiableOnWebsite: dto.visiableOnWebsite ?? false,
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
      throw new NotFoundException(ErrorMessages[ErrorCodes.PRODUCT_NOT_FOUND]);
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
      throw new NotFoundException(ErrorMessages[ErrorCodes.PRODUCT_NOT_FOUND]);
    }

    return {
      message: SuccessMessages[SuccessCodes.PRODUCT_DELETED_SUCCESSFULLY],
    };
  }

  private throwIfDuplicateProductValue(error: unknown): void {
    if (error instanceof QueryFailedError && 'driverError' in error) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (driverError.code === '23505') {
        const constraint = driverError.constraint ?? '';

        if (constraint.includes('sku')) {
          throw new ConflictException(
            ErrorMessages[ErrorCodes.PRODUCT_SKU_ALREADY_EXISTS],
          );
        }

        if (constraint.toLowerCase().includes('barcode')) {
          throw new ConflictException(
            ErrorMessages[ErrorCodes.PRODUCT_BARCODE_ALREADY_EXISTS],
          );
        }

        if (constraint.toLowerCase().includes('producturl')) {
          throw new ConflictException(
            ErrorMessages[ErrorCodes.PRODUCT_URL_ALREADY_EXISTS],
          );
        }

        throw new ConflictException(
          ErrorMessages[ErrorCodes.PRODUCT_UNIQUE_VALUE_ALREADY_EXISTS],
        );
      }
    }
  }

  async getWebsiteProducts() {
    const products = await this.productRepository.find({
      where: { visiableOnWebsite: true },
      select: {
        id: true,
        name: true,
        sku: true,
        model: true,
        image: true,
        category: true,
        brand: true,
        sellingPrice: true,
        productUrl: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return products.map((product) => this.withThumbnail(product));
  }

  async getWebsiteProductByUrl(productUrl: string | string[]) {
    const normalizedProductUrl =
      `/${Array.isArray(productUrl) ? productUrl.join('/') : productUrl}`.replace(
        /^\/+/,
        '/',
      );
    const product = await this.productRepository.findOne({
      where: {
        productUrl: normalizedProductUrl,
        visiableOnWebsite: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        model: true,
        image: true,
        category: true,
        brand: true,
        sellingPrice: true,
        productUrl: true,
        stockQuantity: true,
        barcode: true,
      },
    });

    if (!product) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.PRODUCT_NOT_FOUND]);
    }

    return this.withThumbnail(product);
  }

  async getDashboardProducts() {
    const products = await this.productRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return products.map((product) => this.withThumbnail(product));
  }

  async getDashboardProductById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.PRODUCT_NOT_FOUND]);
    }

    return this.withThumbnail(product);
  }
}
