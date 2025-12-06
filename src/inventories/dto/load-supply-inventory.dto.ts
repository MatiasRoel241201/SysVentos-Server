import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Item individual de insumo para carga de inventario
 */
export class SupplyInventoryItemDto {
    @IsUUID()
    @IsNotEmpty()
    supplyId: string;

    @IsNumber()
    @IsPositive()
    initialQty: number;

    @IsNumber()
    @Min(0)
    minQty: number;

    @IsNumber()
    @IsPositive()
    cost: number;
}

/**
 * DTO para cargar inventario inicial de insumos (batch)
 */
export class LoadSupplyInventoryDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SupplyInventoryItemDto)
    @IsNotEmpty()
    supplies: SupplyInventoryItemDto[];
}
