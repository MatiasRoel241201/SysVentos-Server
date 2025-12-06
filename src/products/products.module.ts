import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSupply } from '../product-supplies/entities/product-supply.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from '../auth/auth.module';
import { Supply } from '../supplies/entities/supply.entity';

/**
 * Módulo para gestionar productos
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductSupply, Supply]),
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Exportar para uso en otros módulos
})
export class ProductsModule { }
