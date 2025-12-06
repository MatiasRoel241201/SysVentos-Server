import { IsUUID, IsNumber, IsPositive, Min } from 'class-validator';

/**
 * DTO para un item individual del pedido
 */
export class CreateOrderItemDto {
    @IsUUID()
    productId: string;

    @IsNumber()
    @IsPositive()
    @Min(1)
    qty: number;
}
