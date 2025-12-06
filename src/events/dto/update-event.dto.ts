import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

/**
 * DTO para actualizar un evento existente
 * Todos los campos son opcionales
 */
export class UpdateEventDto extends PartialType(CreateEventDto) { }
