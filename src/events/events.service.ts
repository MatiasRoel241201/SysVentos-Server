import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OrdersService } from '../orders/services/orders.service';
import { SalesService } from '../sales/sales.service';
import { EventProductInventoryService } from '../inventories/services/event-product-inventory.service';
import { EventSupplyInventoryService } from '../inventories/services/event-supply-inventory.service';

/**
 * Servicio para gestionar eventos
 */
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => SalesService))
    private readonly salesService: SalesService,
    @Inject(forwardRef(() => EventProductInventoryService))
    private readonly productInventoryService: EventProductInventoryService,
    @Inject(forwardRef(() => EventSupplyInventoryService))
    private readonly supplyInventoryService: EventSupplyInventoryService,
  ) { }

  /**
   * Crear un nuevo evento
   * @param createEventDto - Datos del evento
   * @returns Event - Evento creado
   */
  async create(createEventDto: CreateEventDto): Promise<Event> {
    const { name, startDate, endDate } = createEventDto;

    // Validar fechas
    this.validateEventDates(new Date(startDate), new Date(endDate));

    // Validar nombre único
    const normalizedName = name.toLowerCase().trim();
    const existingEvent = await this.findByName(normalizedName);

    if (existingEvent && existingEvent.isActive) {
      throw new BadRequestException(
        `Ya existe un evento activo con el nombre "${name}"`,
      );
    }

    const event = this.eventRepository.create({
      name: normalizedName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return this.eventRepository.save(event);
  }

  /**
   * Listar todos los eventos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Event[] - Array de eventos
   */
  async findAll(paginationDto: PaginationDto): Promise<Event[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.eventRepository.find({
      take: limit,
      skip: offset,
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Listar solo eventos activos con paginación
   * @param paginationDto - Parámetros de paginación
   * @returns Event[] - Array de eventos activos
   */
  async findAllActive(paginationDto: PaginationDto): Promise<Event[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.eventRepository.find({
      where: { isActive: true, isClosed: false },
      take: limit,
      skip: offset,
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Obtener un evento por ID
   * @param id - UUID del evento
   * @returns Event - Evento encontrado
   */
  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Evento con ID "${id}" no encontrado`);

    return event;
  }

  /**
   * Actualizar un evento por ID
   * @param id - UUID del evento
   * @param updateEventDto - Datos a actualizar
   * @returns Event - Evento actualizado
   */
  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.findOne(id);

    // No permitir modificar eventos cerrados
    if (event.isClosed) throw new BadRequestException('No se puede modificar un evento cerrado');

    // Validar fechas si se proporcionan
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const newStartDate = updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : event.startDate;
      const newEndDate = updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : event.endDate;

      this.validateEventDates(newStartDate, newEndDate);
    }

    // Validar nombre único si se modifica
    if (updateEventDto.name) {
      const normalizedName = updateEventDto.name.toLowerCase().trim();

      const existingEvent = await this.eventRepository.findOne({
        where: { name: normalizedName },
      });

      if (existingEvent && existingEvent.id !== id && existingEvent.isActive)
        throw new BadRequestException(`Ya existe un evento activo con el nombre "${updateEventDto.name}"`);

      updateEventDto.name = normalizedName;
    }

    // Convertir fechas a Date si vienen como string
    if (updateEventDto.startDate) updateEventDto.startDate = new Date(updateEventDto.startDate) as any;
    if (updateEventDto.endDate) updateEventDto.endDate = new Date(updateEventDto.endDate) as any;

    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  /**
   * Eliminar lógicamente un evento
   * @param id - UUID del evento
   * @returns Event - Evento desactivado
   */
  async remove(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (!event.isActive) throw new BadRequestException('El evento ya está desactivado');
    if (event.isClosed) throw new BadRequestException('No se puede eliminar un evento cerrado');

    event.isActive = false;
    return this.eventRepository.save(event);
  }

  /**
   * Activar un evento
   * @param id - UUID del evento
   * @returns Event - Evento activado
   */
  async activate(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.isActive) throw new BadRequestException('El evento ya está activo');
    if (event.isClosed) throw new BadRequestException('No se puede activar un evento cerrado');

    event.isActive = true;
    return this.eventRepository.save(event);
  }

  /**
   * Desactivar un evento
   * @param id - UUID del evento
   * @returns Event - Evento desactivado
   */
  async deactivate(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (!event.isActive) throw new BadRequestException('El evento ya está desactivado');
    if (event.isClosed) throw new BadRequestException('No se puede desactivar un evento cerrado (ya está cerrado)');

    event.isActive = false;
    return this.eventRepository.save(event);
  }

  /**
   * Cerrar un evento (finalizado, no modificable)
   * @param id - UUID del evento
   * @returns Event - Evento cerrado
   */
  async close(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.isClosed) throw new BadRequestException('El evento ya está cerrado');

    // Cerrar evento implica desactivarlo también
    event.isClosed = true;
    event.isActive = false;

    return this.eventRepository.save(event);
  }

  /**
   * Obtener estadísticas básicas del evento
   * @param id - UUID del evento
   * @returns Object - Estadísticas del evento
   */
  async getStats(id: string): Promise<any> {
    const event = await this.findOne(id);

    // Obtener todas las órdenes del evento
    const orders = await this.ordersService.findByEvent(id);

    // Obtener totales de ventas
    const salesTotals = await this.salesService.getTotals(id);

    // Obtener inventario de productos del evento
    const productInventories = await this.productInventoryService.findAll(id);

    // Obtener inventario de insumos del evento
    const supplyInventories = await this.supplyInventoryService.findAll(id);

    // Calcular productos más y menos vendidos
    const productSales = new Map<string, { product: any; qty: number; revenue: number; cost: number }>();

    for (const order of orders) {
      if (order.status.name === 'CANCELLED') continue; // No contar canceladas

      for (const item of order.items) {
        const key = item.product.id;
        const existing = productSales.get(key) || { product: item.product, qty: 0, revenue: 0, cost: 0 };

        existing.qty += Number(item.qty);
        existing.revenue += Number(item.qty) * Number(item.unitPrice);

        // Buscar costo del producto en inventario
        const inventory = productInventories.find(inv => inv.product.id === item.product.id);
        if (inventory) {
          existing.cost += Number(item.qty) * Number(inventory.cost);
        }

        productSales.set(key, existing);
      }
    }

    // Convertir a array y ordenar
    const productSalesArray = Array.from(productSales.values());

    // Productos más y menos vendidos
    const sortedByQty = [...productSalesArray].sort((a, b) => b.qty - a.qty);
    const topSelling = sortedByQty.slice(0, 5).map(p => ({
      product: p.product.name,
      qtySold: p.qty,
      revenue: p.revenue,
    }));
    const leastSelling = sortedByQty.slice(-5).reverse().map(p => ({
      product: p.product.name,
      qtySold: p.qty,
      revenue: p.revenue,
    }));

    // Productos con mayor y menor ganancia
    const productsWithProfit = productSalesArray.map(p => ({
      product: p.product.name,
      revenue: p.revenue,
      cost: p.cost,
      profit: p.revenue - p.cost,
      profitMargin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
    }));

    const sortedByProfit = [...productsWithProfit].sort((a, b) => b.profit - a.profit);
    const topProfitable = sortedByProfit.slice(0, 5);
    const leastProfitable = sortedByProfit.slice(-5).reverse();

    // Productos con mayor y menor sobrante
    const productsWithStock = productInventories
      .filter(inv => inv.isActive)
      .map(inv => {
        const sold = productSales.get(inv.product.id)?.qty || 0;
        return {
          product: inv.product.name,
          initialQty: Number(inv.initialQty),
          currentQty: Number(inv.currentQty),
          sold,
          remaining: Number(inv.currentQty),
          wastedPercentage: Number(inv.initialQty) > 0
            ? (Number(inv.currentQty) / Number(inv.initialQty)) * 100
            : 0,
        };
      });

    const sortedByRemaining = [...productsWithStock].sort((a, b) => b.remaining - a.remaining);
    const topRemaining = sortedByRemaining.slice(0, 5);
    const leastRemaining = sortedByRemaining.slice(-5).reverse();

    // Productos con mayor desperdicio (sobrante alto)
    const sortedByWaste = [...productsWithStock].sort((a, b) => b.wastedPercentage - a.wastedPercentage);
    const mostWasted = sortedByWaste.slice(0, 5);

    // Calcular Inversión Total
    const productInvestment = productInventories.reduce((sum, item) => {
      return sum + (Number(item.initialQty) * Number(item.cost));
    }, 0);

    const supplyInvestment = supplyInventories.reduce((sum, item) => {
      return sum + (Number(item.initialQty) * Number(item.cost));
    }, 0);

    const totalInvestment = productInvestment + supplyInvestment;

    return {
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        isClosed: event.isClosed,
      },
      summary: {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status.name === 'COMPLETED').length,
        cancelledOrders: orders.filter(o => o.status.name === 'CANCELLED').length,
        totalRevenue: salesTotals.totalRevenue,
        totalRefunds: salesTotals.totalRefunds,
        netRevenue: salesTotals.netRevenue,
        salesByMethod: salesTotals.byMethod,
        totalInvestment: totalInvestment,
        totalSupplies: supplyInventories.length,
        totalProducts: productInventories.length,
      },
      products: {
        topSelling,
        leastSelling,
        topProfitable,
        leastProfitable,
        topRemaining,
        leastRemaining,
        mostWasted,
      },
    };
  }

  /**
   * Buscar evento por nombre
   * @param name - Nombre normalizado
   * @returns Event | null
   */
  private async findByName(name: string): Promise<Event | null> {
    return this.eventRepository.findOne({
      where: { name: name.toLowerCase().trim() },
    });
  }

  /**
   * Validar que startDate sea anterior o igual a endDate
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   */
  private validateEventDates(startDate: Date, endDate: Date): void {
    if (startDate > endDate) throw new BadRequestException('La fecha de inicio debe ser anterior o igual a la fecha de fin');
  }
}
