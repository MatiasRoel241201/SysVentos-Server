import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize, IsString, IsIn } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

/**
 * DTO para crear un nuevo pedido
 */
export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'El pedido debe contener al menos un producto' })
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsString()
    @IsIn(['EFECTIVO', 'TRANSFERENCIA'], {
        message: 'El método de pago debe ser EFECTIVO o TRANSFERENCIA'
    })
    paymentMethod: string;

    @IsString()
    observations?: string;
}
