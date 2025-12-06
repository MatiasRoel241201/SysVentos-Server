import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventInventory } from './entities/event-inventory.entity';
import { EventSupplyInventory } from './entities/event-supply-inventory.entity';
import { EventProductInventoryService } from './services/event-product-inventory.service';
import { EventSupplyInventoryService } from './services/event-supply-inventory.service';
import { EventProductInventoryController } from './controllers/event-product-inventory.controller';
import { EventSupplyInventoryController } from './controllers/event-supply-inventory.controller';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { ProductsModule } from '../products/products.module';
import { SuppliesModule } from '../supplies/supplies.module';

/**
 * Módulo para gestionar inventarios por evento
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EventInventory, EventSupplyInventory]),
    AuthModule,
    forwardRef(() => EventsModule),
    ProductsModule,
    SuppliesModule,
  ],
  controllers: [
    EventProductInventoryController,
    EventSupplyInventoryController,
  ],
  providers: [
    EventProductInventoryService,
    EventSupplyInventoryService,
  ],
  exports: [
    EventProductInventoryService,
    EventSupplyInventoryService,
  ],
})
export class InventoriesModule { }
