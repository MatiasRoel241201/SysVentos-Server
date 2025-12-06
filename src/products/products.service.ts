import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductSupply } from '../product-supplies/entities/product-supply.entity';
import { AssignSuppliesDto } from './dto/assign-supplies.dto';
import { UpdateSupplyQuantityDto } from './dto/update-supply-quantity.dto';
import { Supply } from '../supplies/entities/supply.entity';

/**
 * Servicio para gestionar productos
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSupply)
    private readonly productSupplyRepository: Repository<ProductSupply>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
  ) { }

  /**
   * Crear un nuevo producto o reactivar uno existente
   * @param createProductDto - Datos del producto
   * @returns Product - Producto creado o reactivado
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { name } = createProductDto;
    const normalizedName = name.toLowerCase().trim();

    const existingProduct = await this.findByName(normalizedName);

    if (existingProduct) {
      if (existingProduct.isActive) throw new BadRequestException(`El producto "${name}" ya existe y está activo`);
      return this.reactivateProduct(existingProduct.id, createProductDto);
    }

    const product = this.productRepository.create({
      ...createProductDto,
      name: normalizedName,
    });

    return this.productRepository.save(product);
  }

  /**
   * Listar todos los productos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Product[] - Array de productos
   */
  async findAll(paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.productRepository.find({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Listar solo productos activos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Product[] - Array de productos activos
   */
  async findAllActive(paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.productRepository.find({
      where: { isActive: true },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Buscar productos por nombre con paginación
   * @param term - Término de búsqueda
   * @param paginationDto - Parámetros de paginación
   * @returns Product[] - Array de productos encontrados
   */
  async search(term: string, paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.productRepository.find({
      where: { name: ILike(`%${term.toLowerCase()}%`) },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener un producto por ID
   * @param id - UUID del producto
   * @returns Product - Producto encontrado
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto con ID "${id}" no encontrado`);
    return product;
  }

  /**
   * Actualizar un producto por ID
   * @param id - UUID del producto
   * @param updateProductDto - Datos a actualizar
   * @returns Product - Producto actualizado
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.name) {
      const normalizedName = updateProductDto.name.toLowerCase().trim();

      const existingProduct = await this.productRepository.findOne({
        where: { name: normalizedName },
      });

      if (existingProduct && existingProduct.id !== id && existingProduct.isActive)
        throw new BadRequestException(`Ya existe un producto activo con el nombre "${updateProductDto.name}"`);

      updateProductDto.name = normalizedName;
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  /**
   * Eliminar lógicamente un producto (soft delete)
   * @param id - UUID del producto
   * @returns Product - Producto desactivado
   */
  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);
    if (!product.isActive) throw new BadRequestException('El producto ya está desactivado');

    product.isActive = false;
    return this.productRepository.save(product);
  }

  /**
   * Asignar múltiples insumos a un producto (batch)
   * Estrategia de reemplazo completo: elimina todas las relaciones existentes
   * y las reemplaza con las nuevas. Esto permite:
   * - Reactivar productos con insumos existentes
   * - Agregar nuevos insumos
   * - Eliminar insumos (no incluirlos en el array)
   * @param productId - UUID del producto
   * @param assignSuppliesDto - Array de insumos
   * @returns ProductSupply[] - Receta completa
   */
  async assignSupplies(productId: string, assignSuppliesDto: AssignSuppliesDto): Promise<ProductSupply[]> {
    const product = await this.findOne(productId);
    if (!product.isActive) throw new BadRequestException('No se pueden asignar insumos a un producto inactivo');

    const { supplies } = assignSuppliesDto;

    // Validar que no haya duplicados en el array
    const supplyIds = supplies.map((s) => s.supplyId);
    const uniqueIds = new Set(supplyIds);
    if (supplyIds.length !== uniqueIds.size) throw new BadRequestException('Hay insumos duplicados en la solicitud');

    // Validar que todos los insumos existan y estén activos
    for (const supplyItem of supplies) {
      const supply = await this.supplyRepository.findOne({
        where: { id: supplyItem.supplyId },
      });

      if (!supply) throw new NotFoundException(`Insumo con ID "${supplyItem.supplyId}" no encontrado`);
      if (!supply.isActive) throw new BadRequestException(`El insumo "${supply.name}" está inactivo`);
    }

    // PASO 1: Eliminar todas las relaciones existentes del producto
    const existingSupplies = await this.productSupplyRepository.find({
      where: { productId },
    });

    if (existingSupplies.length > 0) {
      await this.productSupplyRepository.remove(existingSupplies);
    }

    // PASO 2: Crear las nuevas relaciones
    const productSupplies: ProductSupply[] = [];
    for (const supplyItem of supplies) {
      const productSupply = this.productSupplyRepository.create({
        productId,
        supplyId: supplyItem.supplyId,
        qtyPerUnit: supplyItem.qtyPerUnit,
      });
      const saved = await this.productSupplyRepository.save(productSupply);
      productSupplies.push(saved);
    }

    // PASO 3: Actualizar hasRecipe según si hay insumos
    product.hasRecipe = supplies.length > 0;
    await this.productRepository.save(product);

    return productSupplies;
  }

  /**
   * Obtener la receta de un producto (insumos)
   * @param productId - UUID del producto
   * @returns ProductSupply[] - Receta con insumos
   */
  async getSupplies(productId: string): Promise<ProductSupply[]> {
    await this.findOne(productId); // Validar que exista

    return this.productSupplyRepository.find({
      where: { productId },
      relations: ['supply'],
      order: { supply: { name: 'ASC' } },
    });
  }

  /**
   * Actualizar cantidad de un insumo en la receta
   * @param productId - UUID del producto
   * @param supplyId - UUID del insumo
   * @param updateDto - Nueva cantidad
   * @returns ProductSupply - Relación actualizada
   */
  async updateSupplyQuantity(
    productId: string,
    supplyId: string,
    updateDto: UpdateSupplyQuantityDto,
  ): Promise<ProductSupply> {
    await this.findOne(productId);

    const productSupply = await this.productSupplyRepository.findOne({
      where: { productId, supplyId },
    });

    if (!productSupply) throw new NotFoundException(`El insumo no está asignado a este producto`);

    productSupply.qtyPerUnit = updateDto.qtyPerUnit;
    return this.productSupplyRepository.save(productSupply);
  }

  /**
   * Eliminar un insumo de la receta
   * @param productId - UUID del producto
   * @param supplyId - UUID del insumo
   * @returns void
   */
  async removeSupply(productId: string, supplyId: string): Promise<void> {
    await this.findOne(productId); // Validar que exista

    const productSupply = await this.productSupplyRepository.findOne({
      where: { productId, supplyId },
    });

    if (!productSupply) throw new NotFoundException(`El insumo no está asignado a este producto`);

    await this.productSupplyRepository.remove(productSupply);

    // Verificar si quedan insumos
    const remainingSupplies = await this.productSupplyRepository.count({
      where: { productId },
    });

    if (remainingSupplies === 0) {
      const product = await this.findOne(productId);
      product.hasRecipe = false;
      await this.productRepository.save(product);
    }
  }

  /**
   * Buscar producto por nombre
   * @param name - Nombre normalizado
   * @returns Product | null
   */
  private async findByName(name: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { name: name.toLowerCase().trim() },
    });
  }

  /**
   * Reactivar y actualizar un producto
   * @param id - UUID del producto
   * @param createProductDto - Nuevos datos
   * @returns Product - Producto reactivado
   */
  private async reactivateProduct(
    id: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto con ID "${id}" no encontrado`);

    product.name = createProductDto.name.toLowerCase().trim();
    product.isActive = true;

    return this.productRepository.save(product);
  }
}
