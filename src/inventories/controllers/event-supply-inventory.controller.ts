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
import { EventSupplyInventoryService } from '../services/event-supply-inventory.service';
import { LoadSupplyInventoryDto } from '../dto/load-supply-inventory.dto';
import { UpdateSupplyInventoryDto } from '../dto/update-supply-inventory.dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

/**
 * Controlador para inventario de insumos por evento
 */
@Controller('events/:eventId/inventory/supplies')
export class EventSupplyInventoryController {
    constructor(
        private readonly eventSupplyInventoryService: EventSupplyInventoryService,
    ) { }

    /**
     * Cargar inventario inicial de insumos
     */
    @Auth(ValidRoles.admin)
    @Post()
    loadBatch(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Body() loadDto: LoadSupplyInventoryDto,
    ) {
        return this.eventSupplyInventoryService.loadBatch(eventId, loadDto);
    }

    /**
     * Listar todo el inventario de insumos del evento
     */
    @Auth()
    @Get()
    findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventSupplyInventoryService.findAll(eventId);
    }

    /**
     * Listar solo insumos con stock disponible
     */
    @Auth()
    @Get('available')
    findAvailable(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventSupplyInventoryService.findAvailable(eventId);
    }

    /**
     * Listar insumos con stock bajo (alerta)
     */
    @Auth(ValidRoles.admin)
    @Get('low-stock')
    findLowStock(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventSupplyInventoryService.findLowStock(eventId);
    }

    /**
     * Consultar inventario de un insumo específico
     */
    @Auth()
    @Get(':supplyId')
    findOne(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('supplyId', ParseUUIDPipe) supplyId: string,
    ) {
        return this.eventSupplyInventoryService.findOne(eventId, supplyId);
    }

    /**
     * Actualizar stock de un insumo
     */
    @Auth(ValidRoles.admin)
    @Patch(':supplyId')
    update(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('supplyId', ParseUUIDPipe) supplyId: string,
        @Body() updateDto: UpdateSupplyInventoryDto,
    ) {
        return this.eventSupplyInventoryService.update(eventId, supplyId, updateDto);
    }

    /**
     * Desactivar insumo del inventario
     */
    @Auth(ValidRoles.admin)
    @Delete(':supplyId')
    remove(
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Param('supplyId', ParseUUIDPipe) supplyId: string,
    ) {
        return this.eventSupplyInventoryService.remove(eventId, supplyId);
    }
}
