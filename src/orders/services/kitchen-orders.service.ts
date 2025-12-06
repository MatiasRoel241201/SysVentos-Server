import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { EventProductInventoryService } from '../../inventories/services/event-product-inventory.service';
import { EventSupplyInventoryService } from '../../inventories/services/event-supply-inventory.service';
import { ProductsService } from '../../products/products.service';

/**
 * Servicio para gestionar órdenes desde cocina
 */
@Injectable()
export class KitchenOrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        private readonly ordersService: OrdersService,
        private readonly orderStatusService: OrderStatusService,
        private readonly productInventoryService: EventProductInventoryService,
        private readonly supplyInventoryService: EventSupplyInventoryService,
        private readonly productsService: ProductsService,
    ) { }

    /**
     * Listar órdenes pendientes de un evento
     */
    async findPending(eventId: string): Promise<Order[]> {
        return this.orderRepository.find({
            where: {
                event: { id: eventId },
                status: { name: 'PENDING' },
            },
            relations: ['status', 'createdBy', 'items', 'items.product'],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Listar órdenes por estado
     */
    async findByStatus(eventId: string, statusName: string): Promise<Order[]> {
        return this.orderRepository.find({
            where: {
                event: { id: eventId },
                status: { name: statusName },
            },
            relations: ['status', 'createdBy', 'items', 'items.product'],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Iniciar preparación (PENDING → IN_PROGRESS)
     * Descuenta stock de productos
     */
    async startPreparation(orderId: string): Promise<Order> {
        const order = await this.ordersService.findOne(orderId);

        // Validar estado actual
        if (order.status.name !== 'PENDING') throw new BadRequestException('Solo se pueden iniciar órdenes en estado PENDING');

        // Descontar stock de productos
        for (const item of order.items) {
            await this.productInventoryService.decreaseStock(
                order.event.id,
                item.product.id,
                Number(item.qty),
            );

            // Actualizar estado del item
            item.status = 'IN_PROGRESS';
            await this.orderItemRepository.save(item);
        }

        // Cambiar estado de la orden
        const inProgressStatus =
            await this.orderStatusService.findByName('IN_PROGRESS');
        order.status = inProgressStatus;

        return this.orderRepository.save(order);
    }

    /**
     * Completar preparación (IN_PROGRESS → COMPLETED)
     * Descuenta stock de insumos (si productos tienen receta)
     */
    async completePreparation(orderId: string): Promise<Order> {
        const order = await this.ordersService.findOne(orderId);

        // Validar estado actual
        if (order.status.name !== 'IN_PROGRESS') throw new BadRequestException('Solo se pueden completar órdenes en estado IN_PROGRESS');

        // Descontar stock de insumos por cada producto con receta
        for (const item of order.items) {
            const recipe = await this.productsService.getSupplies(item.product.id);

            // Si el producto tiene receta, descontar insumos
            if (recipe && recipe.length > 0) {
                for (const productSupply of recipe) {
                    const qtyUsed = Number(item.qty) * productSupply.qtyPerUnit;

                    await this.supplyInventoryService.decreaseStock(
                        order.event.id,
                        productSupply.supply.id,
                        qtyUsed,
                    );
                }
            }

            // Actualizar estado del item
            item.status = 'COMPLETED';
            await this.orderItemRepository.save(item);
        }

        // Cambiar estado de la orden
        const completedStatus =
            await this.orderStatusService.findByName('COMPLETED');
        order.status = completedStatus;

        return this.orderRepository.save(order);
    }

    /**
     * Obtener detalle de orden con recetas para cocina
     */
    async getOrderWithRecipes(orderId: string): Promise<any> {
        const order = await this.ordersService.findOne(orderId);

        // Obtener recetas de cada producto
        const itemsWithRecipes = await Promise.all(
            order.items.map(async (item) => {
                const recipe = await this.productsService.getSupplies(
                    item.product.id,
                );

                return {
                    product: item.product,
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    status: item.status,
                    recipe: recipe.map((ps) => ({
                        supply: ps.supply,
                        qtyPerUnit: ps.qtyPerUnit,
                        totalNeeded: Number(item.qty) * ps.qtyPerUnit,
                    })),
                };
            }),
        );

        return {
            ...order,
            items: itemsWithRecipes,
        };
    }
}
