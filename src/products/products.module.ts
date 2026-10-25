import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { DashboardAuthGuard } from '../auth/guards/dashboard-auth.guard.js';
import { DashboardUser } from '../auth/entities/dashboard-user.entity.js';
import { Product } from './entities/product.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, DashboardUser]),
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, DashboardAuthGuard],
})
export class ProductsModule {}
