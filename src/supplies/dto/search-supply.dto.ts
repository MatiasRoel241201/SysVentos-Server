import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * DTO para buscar insumos por nombre con paginación
 */
export class SearchSupplyDto extends PaginationDto {
    /**
     * Término de búsqueda
     * @type string
     * Requerido, busca en el nombre
     */
    @IsString()
    @IsNotEmpty()
    term: string;
}
