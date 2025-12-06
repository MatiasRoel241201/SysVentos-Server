import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para un insumo individual en el batch
 */
export class SupplyItemDto {
    /**
     * ID del insumo
     * @type string
     * UUID del insumo a asignar
     */
    @IsUUID()
    @IsNotEmpty()
    supplyId: string;

    /**
     * Cantidad por unidad de producto
     * @type number
     * Debe ser mayor a 0
     */
    @IsNumber()
    @IsPositive()
    qtyPerUnit: number;
}

/**
 * DTO para asignar múltiples insumos a un producto (batch)
 */
export class AssignSuppliesDto {
    /**
     * Array de insumos a asignar
     * @type SupplyItemDto[]
     * Mínimo 1 insumo requerido
     */
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SupplyItemDto)
    supplies: SupplyItemDto[];
}
