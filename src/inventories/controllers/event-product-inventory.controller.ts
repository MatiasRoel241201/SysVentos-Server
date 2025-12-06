import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
} from '@nestjs/common';
import { EventProductInventoryService } from '../services/event-product-inventory.service';
import { LoadProductInventoryDto } from '../dto/load-product-inventory.dto';
import { UpdateProductInventoryDto } from '../dto/update-product-inventory.dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

/**
 * Controlador para inventario de productos por evento
 */
@Controller('events/:eventId/inventory/products')
export class EventProductInventoryController {
    constructor(
        private readonly eventProductInventoryService: EventProductInventoryService,
    ) { }

    /**
     * Cargar inventario inicial de productos (batch)
     */
    @Auth(ValidRoles.admin)
    @Post()
    loadBatch(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Body() loadDto: LoadProductInventoryDto,
    ) {
        return this.eventProductInventoryService.loadBatch(eventId, loadDto);
    }

    /**
     * Listar todo el inventario de productos del evento
     */
    @Auth()
    @Get()
    findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventProductInventoryService.findAll(eventId);
    }

    /**
     * Listar solo productos con stock disponible
     */
    @Auth()
    @Get('available')
    findAvailable(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventProductInventoryService.findAvailable(eventId);
    }

    /**
     * Listar productos con stock bajo (alerta)
     */
    @Auth(ValidRoles.admin)
    @Get('low-stock')
    findLowStock(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventProductInventoryService.findLowStock(eventId);
    }

    /**
     * Consultar inventario de un producto específico
     */
    @Auth()
    @Get(':productId')
    findOne(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
    ) {
        return this.eventProductInventoryService.findOne(eventId, productId);
    }

    /**
     * Actualizar stock/precio de un producto
     */
    @Auth(ValidRoles.admin)
    @Patch(':productId')
    update(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() updateDto: UpdateProductInventoryDto,
    ) {
        return this.eventProductInventoryService.update(eventId, productId, updateDto);
    }

    /**
     * Desactivar producto del inventario
     */
    @Auth(ValidRoles.admin)
    @Delete(':productId')
    remove(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
    ) {
        return this.eventProductInventoryService.remove(eventId, productId);
    }

    /**
     * Calcular costo de un producto basado en inventario de insumos del evento
     */
    @Auth(ValidRoles.admin)
    @Get('calculate-cost/:productId')
    calculateCost(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
    ) {
        return this.eventProductInventoryService.calculateProductCost(eventId, productId);
    }
}
