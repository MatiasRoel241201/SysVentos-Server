import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO para actualizar un producto existente
 * Todos los campos son opcionales
 */
export class UpdateProductDto extends PartialType(CreateProductDto) { }
