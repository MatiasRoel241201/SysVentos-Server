import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSupplyInventory } from '../entities/event-supply-inventory.entity';
import { LoadSupplyInventoryDto } from '../dto/load-supply-inventory.dto';
import { UpdateSupplyInventoryDto } from '../dto/update-supply-inventory.dto';
import { EventsService } from '../../events/events.service';
import { SuppliesService } from '../../supplies/supplies.service';

/**
 * Servicio para gestionar inventario de insumos por evento
 */
@Injectable()
export class EventSupplyInventoryService {
    constructor(
        @InjectRepository(EventSupplyInventory)
        private readonly eventSupplyInventoryRepository: Repository<EventSupplyInventory>,
        @Inject(forwardRef(() => EventsService))
        private readonly eventsService: EventsService,
        private readonly suppliesService: SuppliesService,
    ) { }

    /**
     * Cargar inventario inicial de insumos
     */
    async loadBatch(
        eventId: string,
        loadDto: LoadSupplyInventoryDto,
    ): Promise<EventSupplyInventory[]> {
        // Validar evento
        const event = await this.eventsService.findOne(eventId);
        if (event.isClosed) throw new BadRequestException('No se puede cargar inventario en evento cerrado');

        const inventories: EventSupplyInventory[] = [];

        for (const item of loadDto.supplies) {
            // Validar insumo
            const supply = await this.suppliesService.findOne(item.supplyId);
            if (!supply.isActive) throw new BadRequestException(`El insumo "${supply.name}" no está activo`);

            // Validar duplicados - si existe y está activo, error. Si está inactivo, se reactivará
            const existing = await this.eventSupplyInventoryRepository.findOne({
                where: { eventId, supplyId: item.supplyId },
            });
            if (existing && existing.isActive) {
                throw new BadRequestException(`El insumo "${supply.name}" ya está en el inventario del evento`);
            }

            // Validar minQty <= initialQty
            if (item.minQty > item.initialQty) throw new BadRequestException(`minQty no puede ser mayor que initialQty para "${supply.name}"`);

            // Si existe pero estaba inactivo, reactivamos
            if (existing && !existing.isActive) {
                existing.isActive = true;
                existing.initialQty = item.initialQty;
                existing.currentQty = item.initialQty;
                existing.minQty = item.minQty;
                existing.cost = item.cost;
                inventories.push(existing);
            } else {
                // Crear inventario nuevo
                const inventory = this.eventSupplyInventoryRepository.create({
                    eventId,
                    supplyId: item.supplyId,
                    initialQty: item.initialQty,
                    currentQty: item.initialQty,
                    minQty: item.minQty,
                    cost: item.cost,
                });
                inventories.push(inventory);
            }
        }

        return this.eventSupplyInventoryRepository.save(inventories);
    }

    /**
     * Listar todo el inventario de insumos de un evento
     */
    async findAll(eventId: string): Promise<EventSupplyInventory[]> {
        await this.eventsService.findOne(eventId);

        return this.eventSupplyInventoryRepository.find({
            where: { eventId, isActive: true },
            relations: ['supply'],
            order: { supply: { name: 'ASC' } },
        });
    }

    /**
     * Listar solo insumos con stock disponible
     */
    async findAvailable(eventId: string): Promise<EventSupplyInventory[]> {
        await this.eventsService.findOne(eventId);

        const inventories = await this.eventSupplyInventoryRepository
            .createQueryBuilder('inv')
            .leftJoinAndSelect('inv.supply', 'supply')
            .where('inv.eventId = :eventId', { eventId })
            .andWhere('inv.isActive = :isActive', { isActive: true })
            .andWhere('inv.currentQty > :zero', { zero: 0 })
            .orderBy('supply.name', 'ASC')
            .getMany();

        return inventories;
    }

    /**
     * Listar insumos con stock bajo (currentQty <= minQty)
     */
    async findLowStock(eventId: string): Promise<EventSupplyInventory[]> {
        await this.eventsService.findOne(eventId);

        const inventories = await this.eventSupplyInventoryRepository
            .createQueryBuilder('inv')
            .leftJoinAndSelect('inv.supply', 'supply')
            .where('inv.eventId = :eventId', { eventId })
            .andWhere('inv.isActive = :isActive', { isActive: true })
            .andWhere('inv.currentQty <= inv.minQty')
            .orderBy('inv.currentQty', 'ASC')
            .getMany();

        return inventories;
    }

    /**
     * Obtener inventario de un insumo específico
     */
    async findOne(eventId: string, supplyId: string): Promise<EventSupplyInventory> {
        const inventory = await this.eventSupplyInventoryRepository.findOne({
            where: { eventId, supplyId },
            relations: ['supply', 'event'],
        });

        if (!inventory) throw new NotFoundException('Inventario no encontrado');
        return inventory;
    }

    /**
     * Actualizar inventario de insumo
     */
    async update(
        eventId: string,
        supplyId: string,
        updateDto: UpdateSupplyInventoryDto,
    ): Promise<EventSupplyInventory> {
        const inventory = await this.findOne(eventId, supplyId);

        // No permitir modificar eventos cerrados
        if (inventory.event.isClosed) throw new BadRequestException('No se puede modificar inventario de evento cerrado');

        // Validar minQty <= initialQty si se actualiza alguno
        const newInitialQty = updateDto.initialQty !== undefined
            ? updateDto.initialQty
            : inventory.initialQty;
        const newMinQty = updateDto.minQty !== undefined
            ? updateDto.minQty
            : inventory.minQty;

        // Convertir a Number para evitar comparación de strings (desde BD PostgreSQL NUMERIC)
        if (Number(newMinQty) > Number(newInitialQty)) {
            throw new BadRequestException(
                'minQty no puede ser mayor que initialQty',
            );
        }

        Object.assign(inventory, updateDto);
        return this.eventSupplyInventoryRepository.save(inventory);
    }

    /**
     * Desactivar insumo del inventario (soft delete)
     */
    async remove(eventId: string, supplyId: string): Promise<EventSupplyInventory> {
        const inventory = await this.findOne(eventId, supplyId);

        if (inventory.event.isClosed) throw new BadRequestException('No se puede modificar inventario de evento cerrado');
        if (!inventory.isActive) throw new BadRequestException('El inventario ya está desactivado');

        inventory.isActive = false;
        return this.eventSupplyInventoryRepository.save(inventory);
    }

    /**
     * Descontar stock (uso interno desde Orders)
     */
    async decreaseStock(
        eventId: string,
        supplyId: string,
        qty: number,
    ): Promise<void> {
        const inventory = await this.findOne(eventId, supplyId);

        if (inventory.currentQty < qty) throw new BadRequestException(`Stock insuficiente de "${inventory.supply.name}"`);

        inventory.currentQty -= qty;
        await this.eventSupplyInventoryRepository.save(inventory);
    }

    /**
     * Aumentar stock (ajustes manuales o devoluciones)
     */
    async increaseStock(
        eventId: string,
        supplyId: string,
        qty: number,
    ): Promise<void> {
        const inventory = await this.findOne(eventId, supplyId);

        inventory.currentQty += qty;
        await this.eventSupplyInventoryRepository.save(inventory);
    }
}
