import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSupply } from '../product-supplies/entities/product-supply.entity';
import { Supply } from './entities/supply.entity';
import { SuppliesService } from './supplies.service';
import { SuppliesController } from './supplies.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Módulo para gestionar insumos (Supplies)
 */
@Module({
    imports: [TypeOrmModule.forFeature([Supply, ProductSupply]), AuthModule],
    controllers: [SuppliesController],
    providers: [SuppliesService],
    exports: [SuppliesService], // Exportar para uso en otros módulos
})
export class SuppliesModule { }
