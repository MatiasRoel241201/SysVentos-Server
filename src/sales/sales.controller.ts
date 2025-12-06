import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interfaces/valid-roles';

/**
 * Controlador de ventas
 */
@Controller('events/:eventId/sales')
@Auth()
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  /**
   * Listar ventas del evento
   * Roles: ADMIN
   */
  @Get()
  @Auth(ValidRoles.admin)
  findAll(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('method') method?: string,
    @Query('status') status?: string,
  ) {
    return this.salesService.findByEvent(eventId, { method, status });
  }

  /**
   * Obtener totales de ventas
   * Roles: ADMIN
   */
  @Get('totals')
  @Auth(ValidRoles.admin)
  getTotals(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.salesService.getTotals(eventId);
  }

  /**
   * Obtener detalle de una venta
   * Roles: ADMIN
   */
  @Get(':saleId')
  @Auth(ValidRoles.admin)
  findOne(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.salesService.findOne(saleId);
  }
}
