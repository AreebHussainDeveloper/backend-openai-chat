import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Patch,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardAuthGuard } from '../auth/guards/dashboard-auth.guard.js';
import {
  PRODUCTS_API_OPTIONS,
  PRODUCTS_API_PREFIX,
  PRODUCTS_API_TAG,
} from './products-api-options.constants.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags(PRODUCTS_API_TAG)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller(PRODUCTS_API_PREFIX)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public website API
  @Get(PRODUCTS_API_OPTIONS.website.path)
  @ApiOperation(PRODUCTS_API_OPTIONS.website.operation)
  getWebsiteProducts() {
    return this.productsService.getWebsiteProducts();
  }

  @Get(PRODUCTS_API_OPTIONS.websiteByUrl.path)
  @ApiOperation(PRODUCTS_API_OPTIONS.websiteByUrl.operation)
  @ApiParam({
    name: 'productUrl',
    description:
      'Product URL path, for example products/wireless-headphones.',
    example: 'products/wireless-headphones',
  })
  getWebsiteProductByUrl(@Param('productUrl') productUrl: string | string[]) {
    return this.productsService.getWebsiteProductByUrl(productUrl);
  }

  // Dashboard API
  @Get(PRODUCTS_API_OPTIONS.dashboard.path)
  @UseGuards(DashboardAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(PRODUCTS_API_OPTIONS.dashboard.operation)
  getDashboardProducts() {
    return this.productsService.getDashboardProducts();
  }

  @Post(PRODUCTS_API_OPTIONS.create.path)
  @UseGuards(DashboardAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(PRODUCTS_API_OPTIONS.create.operation)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get(PRODUCTS_API_OPTIONS.dashboardById.path)
  @UseGuards(DashboardAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(PRODUCTS_API_OPTIONS.dashboardById.operation)
  getDashboardProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getDashboardProductById(id);
  }

  @Patch(PRODUCTS_API_OPTIONS.update.path)
  @UseGuards(DashboardAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(PRODUCTS_API_OPTIONS.update.operation)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(PRODUCTS_API_OPTIONS.delete.path)
  @UseGuards(DashboardAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(PRODUCTS_API_OPTIONS.delete.operation)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.delete(id);
  }
}
