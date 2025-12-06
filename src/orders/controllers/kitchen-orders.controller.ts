import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { KitchenOrdersService } from '../services/kitchen-orders.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ValidRoles } from '../../auth/interfaces/valid-roles';

/**
 * Controlador de órdenes para cocina
 */
@Controller('kitchen/events/:eventId/orders')
@Auth(ValidRoles.cocina, ValidRoles.admin)
export class KitchenOrdersController {
    constructor(
        private readonly kitchenOrdersService: KitchenOrdersService,
    ) { }

    /**
     * Listar órdenes pendientes
     */
    @Get('pending')
    findPending(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.kitchenOrdersService.findPending(eventId);
    }

    /**
     * Listar órdenes por estado
     */
    @Get()
    findByStatus(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Query('status') status: string,
    ) {
        return this.kitchenOrdersService.findByStatus(eventId, status);
    }

    /**
     * Obtener detalle de orden con recetas
     */
    @Get(':orderId')
    findOne(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.kitchenOrdersService.getOrderWithRecipes(orderId);
    }

    /**
     * Iniciar preparación (PENDING → IN_PROGRESS)
     */
    @Patch(':orderId/start')
    startPreparation(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.kitchenOrdersService.startPreparation(orderId);
    }

    /**
     * Completar preparación (IN_PROGRESS → COMPLETED)
     */
    @Patch(':orderId/complete')
    completePreparation(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.kitchenOrdersService.completePreparation(orderId);
    }
}
