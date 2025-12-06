import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
    MinLength,
} from 'class-validator';
import { SupplyUnit } from '../enums/supply-unit.enum';

/**
 * DTO para crear un nuevo insumo (Supply)
 */
export class CreateSupplyDto {
    /**
     * Nombre del insumo
     * @type string
     * Requerido, mínimo 3 caracteres
     */
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    /**
     * Unidad de medida del insumo
     * @type SupplyUnit
     * Valores permitidos: kg, g, lt, ml, unidad, paquete
     */
    @IsEnum(SupplyUnit)
    @IsNotEmpty()
    unit: SupplyUnit;


}
