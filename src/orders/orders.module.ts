import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStatus } from './entities/order-status.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusService } from './services/order-status.service';
import { OrdersService } from './services/orders.service';
import { KitchenOrdersService } from './services/kitchen-orders.service';
import { OrdersController } from './controllers/orders.controller';
import { KitchenOrdersController } from './controllers/kitchen-orders.controller';
import { EventsModule } from '../events/events.module';
import { InventoriesModule } from '../inventories/inventories.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderStatus, OrderItem]),
    forwardRef(() => EventsModule),
    forwardRef(() => InventoriesModule),
    ProductsModule,
    AuthModule,
    SalesModule,
  ],
  controllers: [OrdersController, KitchenOrdersController],
  providers: [OrderStatusService, OrdersService, KitchenOrdersService],
  exports: [OrdersService, KitchenOrdersService],
})
export class OrdersModule { }
