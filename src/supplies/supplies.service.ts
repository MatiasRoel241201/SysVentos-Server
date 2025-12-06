import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { Supply } from './entities/supply.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductSupply } from '../product-supplies/entities/product-supply.entity';

/**
 * Servicio para gestionar insumos (Supplies)
 */
@Injectable()
export class SuppliesService {
    constructor(
        @InjectRepository(Supply)
        private readonly supplyRepository: Repository<Supply>,
        @InjectRepository(ProductSupply)
        private readonly productSupplyRepository: Repository<ProductSupply>,
    ) { }

    /**
     * Crear un nuevo insumo o reactivar uno existente
     * @param createSupplyDto - Datos del insumo
     * @returns Supply - Insumo creado o reactivado
     */
    async create(createSupplyDto: CreateSupplyDto): Promise<Supply> {
        const { name } = createSupplyDto;

        // Normalizar nombre (lowercase y trim)
        const normalizedName = name.toLowerCase().trim();

        // Buscar si existe un insumo con el mismo nombre (activo o inactivo)
        const existingSupply = await this.findByName(normalizedName);

        if (existingSupply) {
            // Si está activo, lanzar error
            if (existingSupply.isActive) throw new BadRequestException(`El insumo "${name}" ya existe y está activo`);

            // Si está inactivo, reactivarlo y actualizar datos
            return this.reactivateSupply(existingSupply.id, createSupplyDto);
        }

        // Si no existe, crear uno nuevo
        const supply = this.supplyRepository.create({
            ...createSupplyDto,
            name: normalizedName,
        });

        return this.supplyRepository.save(supply);
    }

    /**
     * Listar todos los insumos con paginación
     * @param paginationDto - Parámetros de paginación
     * @returns Supply[] - Array de insumos
     */
    async findAll(paginationDto: PaginationDto): Promise<Supply[]> {
        const { limit = 10, offset = 0 } = paginationDto;

        return this.supplyRepository.find({
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Listar solo insumos activos con paginación
     * @param paginationDto - Parámetros de paginación
     * @returns Supply[] - Array de insumos activos
     */
    async findAllActive(paginationDto: PaginationDto): Promise<Supply[]> {
        const { limit = 10, offset = 0 } = paginationDto;

        return this.supplyRepository.find({
            where: { isActive: true },
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Buscar insumos por nombre con paginación
     * @param term - Término de búsqueda
     * @param paginationDto - Parámetros de paginación
     * @returns Supply[] - Array de insumos encontrados
     */
    async search(term: string, paginationDto: PaginationDto): Promise<Supply[]> {
        const { limit = 10, offset = 0 } = paginationDto;

        return this.supplyRepository.find({
            where: { name: ILike(`%${term.toLowerCase()}%`) },
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Obtener un insumo por ID
     * @param id - UUID del insumo
     * @returns Supply - Insumo encontrado
     */
    async findOne(id: string): Promise<Supply> {
        const supply = await this.supplyRepository.findOne({ where: { id } });

        if (!supply) throw new NotFoundException(`Insumo con ID "${id}" no encontrado`);
        return supply;
    }

    /**
     * Actualizar un insumo por ID
     * @param id - UUID del insumo
     * @param updateSupplyDto - Datos a actualizar
     * @returns Supply - Insumo actualizado
     */
    async update(id: string, updateSupplyDto: UpdateSupplyDto): Promise<Supply> {
        const supply = await this.findOne(id);

        // Si se está actualizando el nombre, validar que no exista otro insumo activo con ese nombre
        if (updateSupplyDto.name) {
            const normalizedName = updateSupplyDto.name.toLowerCase().trim();

            const existingSupply = await this.supplyRepository.findOne({
                where: { name: normalizedName },
            });

            if (existingSupply && existingSupply.id !== id && existingSupply.isActive)
                throw new BadRequestException(`Ya existe un insumo activo con el nombre "${updateSupplyDto.name}"`);
            updateSupplyDto.name = normalizedName;
        }

        // Actualizar datos
        Object.assign(supply, updateSupplyDto);

        return this.supplyRepository.save(supply);
    }

    /**
     * Eliminar lógicamente un insumo (soft delete)
     * @param id - UUID del insumo
     * @returns Supply - Insumo desactivado
     */
    async remove(id: string): Promise<Supply> {
        const supply = await this.findOne(id);

        if (!supply.isActive) throw new BadRequestException('El insumo ya está desactivado');

        supply.isActive = false;
        return this.supplyRepository.save(supply);
    }

    /**
     * Buscar insumo por nombre (privado)
     * @param name - Nombre normalizado del insumo
     * @returns Supply | null
     */
    private async findByName(name: string): Promise<Supply | null> {
        return this.supplyRepository.findOne({
            where: { name: name.toLowerCase().trim() },
        });
    }

    /**
     * Reactivar y actualizar un insumo (privado)
     * @param id - UUID del insumo
     * @param createSupplyDto - Nuevos datos
     * @returns Supply - Insumo reactivado
     */
    private async reactivateSupply(
        id: string,
        createSupplyDto: CreateSupplyDto,
    ): Promise<Supply> {
        const supply = await this.supplyRepository.findOne({ where: { id } });

        if (!supply) throw new NotFoundException(`Insumo con ID "${id}" no encontrado`);

        // Actualizar datos y reactivar
        supply.name = createSupplyDto.name.toLowerCase().trim();
        supply.unit = createSupplyDto.unit;
        supply.isActive = true;

        return this.supplyRepository.save(supply);
    }

    /**
     * Obtener productos que usan este insumo
     * @param supplyId - UUID del insumo
     * @returns ProductSupply[] - Productos con cantidades
     */
    async getProducts(supplyId: string): Promise<ProductSupply[]> {
        await this.findOne(supplyId); // Validar que el insumo exista

        return this.productSupplyRepository.find({
            where: { supplyId },
            relations: ['product'],
            order: { product: { name: 'ASC' } },
        });
    }
}
