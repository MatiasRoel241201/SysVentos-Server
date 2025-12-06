import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity({ name: 'event_supply_inventories' })
export class EventSupplyInventory {
  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @PrimaryColumn({ name: 'supply_id', type: 'uuid' })
  supplyId: string;

  @ManyToOne(() => Event, (event) => event.eventSupplyInventories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Supply, (supply) => supply.eventSupplyInventories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supply_id' })
  supply: Supply;

  @Column({ name: 'initial_qty', type: 'numeric', precision: 10, scale: 2 })
  initialQty: number;

  @Column({ name: 'current_qty', type: 'numeric', precision: 10, scale: 2 })
  currentQty: number;

  @Column({ name: 'min_qty', type: 'numeric', precision: 10, scale: 2 })
  minQty: number;

  @Column({ name: 'cost', type: 'numeric', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'now()',
  })
  updatedAt: Date;
}
