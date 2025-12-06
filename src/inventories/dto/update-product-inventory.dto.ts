import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

/**
 * DTO para actualizar inventario de producto
 */
export class UpdateProductInventoryDto {
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

    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    profitMargin?: number;
}
