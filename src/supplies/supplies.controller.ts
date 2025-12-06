import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SearchSupplyDto } from './dto/search-supply.dto';

/**
 * Controlador para gestionar insumos.
 */
@Auth(ValidRoles.admin)
@Controller('supplies')
export class SuppliesController {
    constructor(private readonly suppliesService: SuppliesService) { }

    /**
     * Crear un nuevo insumo o reactivar uno existente
     * @param createSupplyDto - Datos del insumo
     * @returns Supply - Insumo creado/reactivado
     */
    @Post()
    create(@Body() createSupplyDto: CreateSupplyDto) {
        return this.suppliesService.create(createSupplyDto);
    }

    /**
     * Listar todos los insumos con paginación
     * @param paginationDto - Parámetros de paginación
     * @returns Supply[] - Array de insumos
     */
    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.suppliesService.findAll(paginationDto);
    }

    /**
     * Listar solo insumos activos con paginación
     * @param paginationDto - Parámetros de paginación
     * @returns Supply[] - Insumos activos
     */
    @Get('active')
    findAllActive(@Query() paginationDto: PaginationDto) {
        return this.suppliesService.findAllActive(paginationDto);
    }

    /**
     * Buscar insumos por nombre con paginación
     * @param searchDto - Parámetros de búsqueda
     * @returns Supply[] - Insumos encontrados
     */
    @Get('search')
    search(@Query() searchDto: SearchSupplyDto) {
        return this.suppliesService.search(searchDto.term, searchDto);
    }

    /**
     * Obtener un insumo específico por ID
     * @param id - UUID del insumo
     * @returns Supply - Insumo encontrado
     */
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        console.log('ENTRO EN FINDONE --> ', id)
        return this.suppliesService.findOne(id);
    }

    /**
     * Obtener productos que usan este insumo
     * @param id - UUID del insumo
     * @returns ProductSupply[] - Productos que usan el insumo
     */
    @Get(':id/products')
    findProducts(@Param('id', ParseUUIDPipe) id: string) {
        return this.suppliesService.getProducts(id);
    }

    /**
     * Actualizar un insumo por ID
     * @param id - UUID del insumo
     * @param updateSupplyDto - Datos a actualizar
     * @returns Supply - Insumo actualizado
     */
    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateSupplyDto: UpdateSupplyDto,
    ) {
        return this.suppliesService.update(id, updateSupplyDto);
    }

    /**
     * Eliminar lógicamente un insumo (soft delete)
     * @param id - UUID del insumo
     * @returns Supply - Insumo desactivado
     */
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.suppliesService.remove(id);
    }
}
