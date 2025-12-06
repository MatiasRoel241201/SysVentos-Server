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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { AssignSuppliesDto } from './dto/assign-supplies.dto';
import { UpdateSupplyQuantityDto } from './dto/update-supply-quantity.dto';

/**
 * Controlador para gestionar productos
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  /**
   * Crear un nuevo producto o reactivar uno existente
   * @param createProductDto - Datos del producto
   * @returns Product - Producto creado/reactivado
   */
  @Auth(ValidRoles.admin)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Listar todos los productos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Product[] - Array de productos
   */
  @Auth(ValidRoles.admin)
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  /**
   * Listar solo productos activos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Product[] - Productos activos
   */
  @Auth()
  @Get('active')
  findAllActive(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAllActive(paginationDto);
  }

  /**
   * Buscar productos por nombre con paginación
   * @param searchDto - Parámetros de búsqueda
   * @returns Product[] - Productos encontrados
   */
  @Auth()
  @Get('search')
  search(@Query() searchDto: SearchProductDto) {
    return this.productsService.search(searchDto.term, searchDto);
  }

  /**
   * Obtener un producto específico por ID
   * @param id - UUID del producto
   * @returns Product - Producto encontrado
   */
  @Auth()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Obtener la receta de un producto
   * @param id - UUID del producto
   * @returns ProductSupply[] - Insumos del producto
   */
  @Auth()
  @Get(':id/supplies')
  getSupplies(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getSupplies(id);
  }

  /**
   * Actualizar un producto por ID
   * @param id - UUID del producto
   * @param updateProductDto - Datos a actualizar
   * @returns Product - Producto actualizado
   */
  @Auth(ValidRoles.admin)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Eliminar lógicamente un producto
   * @param id - UUID del producto
   * @returns Product - Producto desactivado
   */
  @Auth(ValidRoles.admin)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  /**
   * Asignar múltiples insumos a un producto
   * @param id - UUID del producto
   * @param assignSuppliesDto - Array de insumos
   * @returns ProductSupply[] - Receta completa
   */
  @Auth(ValidRoles.admin)
  @Post(':id/supplies/batch')
  assignSupplies(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignSuppliesDto: AssignSuppliesDto,
  ) {
    return this.productsService.assignSupplies(id, assignSuppliesDto);
  }

  /**
   * Actualizar cantidad de un insumo en la receta
   * @param productId - UUID del producto
   * @param supplyId - UUID del insumo
   * @param updateDto - Nueva cantidad
   * @returns ProductSupply - Relación actualizada
   */
  @Auth(ValidRoles.admin)
  @Patch(':productId/supplies/:supplyId')
  updateSupplyQuantity(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('supplyId', ParseUUIDPipe) supplyId: string,
    @Body() updateDto: UpdateSupplyQuantityDto,
  ) {
    return this.productsService.updateSupplyQuantity(productId, supplyId, updateDto);
  }

  /**
   * Eliminar un insumo de la receta
   * @param productId - UUID del producto
   * @param supplyId - UUID del insumo
   * @returns void
   */
  @Auth(ValidRoles.admin)
  @Delete(':productId/supplies/:supplyId')
  removeSupply(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('supplyId', ParseUUIDPipe) supplyId: string,
  ) {
    return this.productsService.removeSupply(productId, supplyId);
  }
}
