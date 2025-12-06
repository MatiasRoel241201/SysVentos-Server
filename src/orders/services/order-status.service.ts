import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from '../entities/order-status.entity';

/**
 * Servicio para gestionar estados de órdenes
 */
@Injectable()
export class OrderStatusService implements OnModuleInit {
    constructor(
        @InjectRepository(OrderStatus)
        private readonly orderStatusRepository: Repository<OrderStatus>,
    ) { }

    /**
     * Inicializar estados al arrancar el módulo
     */
    async onModuleInit() {
        await this.seedStatuses();
    }

    /**
     * Crear estados iniciales si no existen
     */
    async seedStatuses(): Promise<void> {
        const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

        for (const statusName of statuses) {
            const existing = await this.orderStatusRepository.findOne({
                where: { name: statusName },
            });

            if (!existing) await this.orderStatusRepository.save({ name: statusName });
        }
    }

    /**
     * Obtener estado por nombre
     */
    async findByName(name: string): Promise<OrderStatus> {
        const status = await this.orderStatusRepository.findOne({
            where: { name },
        });

        if (!status) throw new NotFoundException(`Estado "${name}" no encontrado`);

        return status;
    }

    /**
     * Listar todos los estados
     */
    async findAll(): Promise<OrderStatus[]> {
        return this.orderStatusRepository.find();
    }
}
