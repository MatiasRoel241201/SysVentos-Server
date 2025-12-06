import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    ParseUUIDPipe,
    ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ValidRoles } from '../../auth/interfaces/valid-roles';
import { User } from '../../users/entities/user.entity';

/**
 * Controlador principal de órdenes (CAJERO + ADMIN)
 */
@Controller('events/:eventId/orders')
@Auth()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    /**
     * Crear nuevo pedido
     * Roles: CAJERO, ADMIN
     */
    @Post()
    @Auth(ValidRoles.cajero, ValidRoles.admin)
    create(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @GetUser() user: User,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.ordersService.create(eventId, user.id, createOrderDto);
    }

    /**
     * Listar órdenes del evento
     * - CAJERO: Solo sus propias órdenes
     * - ADMIN: Todas las órdenes (con filtros opcionales)
     */
    @Get()
    @Auth(ValidRoles.cajero, ValidRoles.admin)
    findAll(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @GetUser() user: User,
        @Query('status') status?: string,
        @Query('createdBy', new ParseUUIDPipe({ optional: true }))
        createdBy?: string,
        @Query('orderNumber') orderNumber?: string,
    ) {
        // Si es CAJERO, solo ve sus órdenes
        if (user.userRoles.some((r) => r.role.name === ValidRoles.cajero)) {
            return this.ordersService.findByUser(eventId, user.id);
        }

        // Si es ADMIN, puede ver todas con filtros
        return this.ordersService.findByEvent(eventId, {
            status,
            createdBy,
            orderNumber: orderNumber ? parseInt(orderNumber) : undefined,
        });
    }

    /**
     * Obtener detalle de un pedido
     * Roles: CAJERO (si lo creó), ADMIN
     */
    @Get(':orderId')
    @Auth(ValidRoles.cajero, ValidRoles.admin)
    async findOne(
        @Param('orderId', ParseUUIDPipe) orderId: string,
        @GetUser() user: User,
    ) {
        const order = await this.ordersService.findOne(orderId);

        // Si es CAJERO, validar que sea suya
        if (user.userRoles.some((r) => r.role.name === ValidRoles.cajero)) {
            if (order.createdBy.id !== user.id) throw new ForbiddenException('No tienes permiso para ver esta orden');
        }

        return order;
    }

    /**
     * Cancelar pedido
     * Roles: Solo ADMIN
     */
    @Patch(':orderId/cancel')
    @Auth(ValidRoles.admin)
    cancel(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.ordersService.cancel(orderId);
    }
}
