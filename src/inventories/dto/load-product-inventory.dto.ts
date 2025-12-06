import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Item individual de producto para carga de inventario
 */
export class ProductInventoryItemDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @IsPositive()
    initialQty: number;

    @IsNumber()
    @Min(0)
    minQty: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    cost?: number;

    @IsNumber()
    @IsPositive()
    salePrice: number;
}

/**
 * DTO para cargar inventario inicial de productos (batch)
 */
export class LoadProductInventoryDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductInventoryItemDto)
    @IsNotEmpty()
    products: ProductInventoryItemDto[];
}
