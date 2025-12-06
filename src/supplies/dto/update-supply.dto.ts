import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplyDto } from './create-supply.dto';

/**
 * DTO para actualizar un insumo existente
 * Todos los campos son opcionales
 */
export class UpdateSupplyDto extends PartialType(CreateSupplyDto) { }
