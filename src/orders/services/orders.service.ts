import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatusService } from './order-status.service';
import { EventsService } from '../../events/events.service';
import { EventProductInventoryService } from '../../inventories/services/event-product-inventory.service';
import { SalesService } from '../../sales/sales.service';

/**
 * Servicio para gestionar órdenes
 */
@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        private readonly orderStatusService: OrderStatusService,
        @Inject(forwardRef(() => EventsService))
        private readonly eventsService: EventsService,
        @Inject(forwardRef(() => EventProductInventoryService))
        private readonly productInventoryService: EventProductInventoryService,
        private readonly salesService: SalesService,
    ) { }

    /**
     * Crear nuevo pedido
     */
    async create(
        eventId: string,
        userId: string,
        createDto: CreateOrderDto,
    ): Promise<Order> {
        // Validar evento
        const event = await this.eventsService.findOne(eventId);
        if (event.isClosed) throw new BadRequestException('No se pueden crear pedidos en eventos cerrados');

        // Obtener último número de orden del evento
        const lastOrder = await this.orderRepository.findOne({
            where: { event: { id: eventId } },
            order: { orderNumber: 'DESC' },
        });
        const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

        // Validar productos y calcular total
        let totalAmount = 0;
        const orderItems: OrderItem[] = [];

        for (const item of createDto.items) {
            // Verificar que producto esté en inventario del evento
            const inventory = await this.productInventoryService.findOne(
                eventId,
                item.productId,
            );

            if (!inventory.isActive) throw new BadRequestException(`El producto "${inventory.product.name}" no está disponible`);

            // Validar stock disponible
            if (Number(inventory.currentQty) < item.qty) throw new BadRequestException(`Stock insuficiente de "${inventory.product.name}". Disponible: ${inventory.currentQty}`);

            // Crear item
            const orderItem = this.orderItemRepository.create({
                product: inventory.product,
                qty: item.qty,
                unitPrice: inventory.salePrice,
                status: 'PENDING',
            });

            orderItems.push(orderItem);
            totalAmount += Number(inventory.salePrice) * item.qty;
        }

        // Obtener estado PENDING
        const pendingStatus = await this.orderStatusService.findByName('PENDING');

        // Crear orden
        const order = this.orderRepository.create({
            event: { id: eventId },
            createdBy: { id: userId },
            orderNumber,
            status: pendingStatus,
            totalAmount,
            observations: createDto.observations,
            items: orderItems,
        });

        const savedOrder = await this.orderRepository.save(order);

        // Crear venta automáticamente
        await this.salesService.create({
            orderId: savedOrder.id,
            method: createDto.paymentMethod,
            amount: totalAmount,
        });

        return savedOrder;
    }

    /**
     * Listar órdenes de un evento (para ADMIN)
     */
    async findByEvent(
        eventId: string,
        filters?: {
            status?: string;
            createdBy?: string;
            orderNumber?: number;
        },
    ): Promise<Order[]> {
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.status', 'status')
            .leftJoinAndSelect('order.createdBy', 'user')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .where('order.event.id = :eventId', { eventId });

        if (filters?.status) {
            queryBuilder.andWhere('status.name = :status', {
                status: filters.status,
            });
        }

        if (filters?.createdBy) {
            queryBuilder.andWhere('user.id = :userId', {
                userId: filters.createdBy,
            });
        }

        if (filters?.orderNumber) {
            queryBuilder.andWhere('order.orderNumber = :orderNumber', {
                orderNumber: filters.orderNumber,
            });
        }

        queryBuilder.orderBy('order.createdAt', 'DESC');

        return queryBuilder.getMany();
    }

    /**
     * Listar órdenes creadas por un cajero específico
     */
    async findByUser(eventId: string, userId: string): Promise<Order[]> {
        return this.orderRepository.find({
            where: {
                event: { id: eventId },
                createdBy: { id: userId },
            },
            relations: ['status', 'createdBy', 'items', 'items.product'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Obtener detalle de una orden
     */
    async findOne(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: [
                'status',
                'createdBy',
                'event',
                'items',
                'items.product',
            ],
        });

        if (!order) throw new NotFoundException('Orden no encontrada');

        return order;
    }

    /**
     * Cancelar orden (solo PENDING)
     */
    async cancel(orderId: string): Promise<Order> {
        const order = await this.findOne(orderId);

        if (order.status.name !== 'PENDING') throw new BadRequestException('Solo se pueden cancelar órdenes en estado PENDING');

        const cancelledStatus = await this.orderStatusService.findByName('CANCELLED');
        order.status = cancelledStatus;

        // Actualizar estado de items
        for (const item of order.items) {
            item.status = 'CANCELLED';
            await this.orderItemRepository.save(item);
        }

        const cancelledOrder = await this.orderRepository.save(order);

        // Cancelar venta asociada (reembolso)
        await this.salesService.cancelByOrder(orderId);

        return cancelledOrder;
    }
}
