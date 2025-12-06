import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para paginación de listados
 */
export class PaginationDto {
    /**
     * Límite de resultados
     * @type number
     * Default: 10, Max: 100
     */
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    limit?: number = 10;

    /**
     * Offset para paginación
     * @type number
     * Default: 0, Min: 0
     */
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset?: number = 0;
}
