import { IsUUID, IsString, IsIn, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para crear una venta
 */
export class CreateSaleDto {
    @IsUUID()
    orderId: string;

    @IsString()
    @IsIn(['EFECTIVO', 'TRANSFERENCIA'])
    method: string;

    @IsNumber()
    @IsPositive()
    amount: number;
}
