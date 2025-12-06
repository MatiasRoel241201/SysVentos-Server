import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventInventory } from '../../inventories/entities/event-inventory.entity';
import { EventSupplyInventory } from '../../inventories/entities/event-supply-inventory.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({
    name: 'start_date',
    type: 'timestamp without time zone',
  })
  startDate: Date;

  @Column({
    name: 'end_date',
    type: 'timestamp without time zone',
  })
  endDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToMany(() => EventInventory, (eventInventory) => eventInventory.event)
  eventInventories: EventInventory[];

  @OneToMany(
    () => EventSupplyInventory,
    (eventSupplyInventory) => eventSupplyInventory.event,
  )
  eventSupplyInventories: EventSupplyInventory[];

  @OneToMany(() => Order, (order) => order.event)
  orders: Order[];
}
