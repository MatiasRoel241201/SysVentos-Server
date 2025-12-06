import { IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para actualizar la cantidad de un insumo en la receta
 */
export class UpdateSupplyQuantityDto {
    /**
     * Nueva cantidad por unidad
     * @type number
     * Debe ser mayor a 0
     */
    @IsNumber()
    @IsPositive()
    qtyPerUnit: number;
}
