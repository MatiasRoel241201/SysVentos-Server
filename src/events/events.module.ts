import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { SalesModule } from '../sales/sales.module';
import { InventoriesModule } from '../inventories/inventories.module';

/**
 * Módulo para gestionar eventos
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    AuthModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => SalesModule),
    forwardRef(() => InventoriesModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // Exportar para uso en otros módulos
})
export class EventsModule { }
