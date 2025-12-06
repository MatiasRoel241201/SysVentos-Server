import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

/**
 * Servicio para gestionar ventas
 */
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) { }

  /**
   * Crear venta (uso interno desde Orders)
   */
  async create(createDto: CreateSaleDto): Promise<Sale> {
    // Verificar que no exista venta para este pedido
    const existing = await this.saleRepository.findOne({
      where: { order: { id: createDto.orderId } },
    });

    if (existing) throw new BadRequestException('Ya existe una venta registrada para este pedido');

    const sale = this.saleRepository.create({
      order: { id: createDto.orderId },
      method: createDto.method,
      amount: createDto.amount,
      status: 'COMPLETED',
    });

    return this.saleRepository.save(sale);
  }

  /**
   * Cancelar venta por pedido (reembolso)
   */
  async cancelByOrder(orderId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (!sale) throw new NotFoundException('No se encontró venta asociada a este pedido');

    if (sale.status === 'CANCELLED') throw new BadRequestException('La venta ya está cancelada');

    sale.status = 'CANCELLED';
    return this.saleRepository.save(sale);
  }

  /**
   * Listar ventas de un evento
   */
  async findByEvent(
    eventId: string,
    filters?: { method?: string; status?: string },
  ): Promise<Sale[]> {
    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.order', 'order')
      .leftJoinAndSelect('order.createdBy', 'user')
      .where('order.event.id = :eventId', { eventId });

    if (filters?.method) queryBuilder.andWhere('sale.method = :method', { method: filters.method });
    if (filters?.status) queryBuilder.andWhere('sale.status = :status', { status: filters.status });

    queryBuilder.orderBy('sale.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Obtener detalle de una venta
   */
  async findOne(saleId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: [
        'order',
        'order.createdBy',
        'order.items',
        'order.items.product',
      ],
    });

    if (!sale) throw new NotFoundException('Venta no encontrada');

    return sale;
  }

  /**
   * Obtener venta por pedido
   */
  async findByOrder(orderId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'order.createdBy'],
    });

    if (!sale) throw new NotFoundException('No se encontró venta para este pedido');

    return sale;
  }

  /**
   * Obtener totales de ventas por evento
   */
  async getTotals(eventId: string): Promise<any> {
    const sales = await this.findByEvent(eventId);

    const completed = sales.filter((s) => s.status === 'COMPLETED');
    const cancelled = sales.filter((s) => s.status === 'CANCELLED');

    const totalRevenue = completed.reduce(
      (sum, s) => sum + Number(s.amount),
      0,
    );
    const totalRefunds = cancelled.reduce(
      (sum, s) => sum + Number(s.amount),
      0,
    );

    const efectivoCompleted = completed.filter((s) => s.method === 'EFECTIVO');
    const transferenciaCompleted = completed.filter(
      (s) => s.method === 'TRANSFERENCIA',
    );
    const efectivoCancelled = cancelled.filter((s) => s.method === 'EFECTIVO');
    const transferenciaCancelled = cancelled.filter(
      (s) => s.method === 'TRANSFERENCIA',
    );

    return {
      totalSales: sales.length,
      completedSales: completed.length,
      cancelledSales: cancelled.length,
      totalRevenue,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds,
      byMethod: {
        EFECTIVO: {
          completed: {
            count: efectivoCompleted.length,
            amount: efectivoCompleted.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            ),
          },
          cancelled: {
            count: efectivoCancelled.length,
            amount: efectivoCancelled.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            ),
          },
          net:
            efectivoCompleted.reduce((sum, s) => sum + Number(s.amount), 0) -
            efectivoCancelled.reduce((sum, s) => sum + Number(s.amount), 0),
        },
        TRANSFERENCIA: {
          completed: {
            count: transferenciaCompleted.length,
            amount: transferenciaCompleted.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            ),
          },
          cancelled: {
            count: transferenciaCancelled.length,
            amount: transferenciaCancelled.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            ),
          },
          net:
            transferenciaCompleted.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            ) -
            transferenciaCancelled.reduce(
              (sum, s) => sum + Number(s.amount),
              0,
            ),
        },
      },
    };
  }
}
