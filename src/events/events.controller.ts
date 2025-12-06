import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { PaginationDto } from '../common/dto/pagination.dto';

/**
 * Controlador para gestionar eventos
 */
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  /**
   * Crear un nuevo evento
   * @param createEventDto - Datos del evento
   * @returns Event - Evento creado
   */
  @Auth(ValidRoles.admin)
  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  /**
   * Listar todos los eventos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Event[] - Array de eventos
   */
  @Auth(ValidRoles.admin)
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.eventsService.findAll(paginationDto);
  }

  /**
   * Listar solo eventos activos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Event[] - Eventos activos
   */
  @Auth()
  @Get('active')
  findAllActive(@Query() paginationDto: PaginationDto) {
    return this.eventsService.findAllActive(paginationDto);
  }

  /**
   * Obtener un evento específico por ID
   * @param id - UUID del evento
   * @returns Event - Evento encontrado
   */
  @Auth()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  /**
   * Obtener estadísticas básicas del evento
   * @param id - UUID del evento
   * @returns Object - Estadísticas del evento
   */
  @Auth(ValidRoles.admin)
  @Get(':id/stats')
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.getStats(id);
  }

  /**
   * Actualizar un evento por ID
   * @param id - UUID del evento
   * @param updateEventDto - Datos a actualizar
   * @returns Event - Evento actualizado
   */
  @Auth(ValidRoles.admin)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  /**
   * Activar un evento
   * @param id - UUID del evento
   * @returns Event - Evento activado
   */
  @Auth(ValidRoles.admin)
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.activate(id);
  }

  /**
   * Desactivar un evento
   * @param id - UUID del evento
   * @returns Event - Evento desactivado
   */
  @Auth(ValidRoles.admin)
  @Patch(':id/desactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.deactivate(id);
  }

  /**
   * Cerrar un evento (finalizado, no modificable)
   * @param id - UUID del evento
   * @returns Event - Evento cerrado
   */
  @Auth(ValidRoles.admin)
  @Patch(':id/close')
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.close(id);
  }

  /**
   * Eliminar lógicamente un evento (soft delete)
   * @param id - UUID del evento
   * @returns Event - Evento desactivado
   */
  @Auth(ValidRoles.admin)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.remove(id);
  }
}
