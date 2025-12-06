import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * DTO para actualizar inventario de insumo
 */
export class UpdateSupplyInventoryDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    initialQty?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    currentQty?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minQty?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    cost?: number;
}
