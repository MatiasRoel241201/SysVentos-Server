import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * DTO para buscar productos por nombre con paginación
 */
export class SearchProductDto extends PaginationDto {
    /**
     * Término de búsqueda
     * @type string
     * Requerido, busca en el nombre
     */
    @IsString()
    @IsNotEmpty()
    term: string;
}
