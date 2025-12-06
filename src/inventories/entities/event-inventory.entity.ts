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
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'event_inventories' })
export class EventInventory {
  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Event, (event) => event.eventInventories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Product, (product) => product.eventInventories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'initial_qty', type: 'numeric', precision: 10, scale: 2 })
  initialQty: number;

  @Column({ name: 'current_qty', type: 'numeric', precision: 10, scale: 2 })
  currentQty: number;

  @Column({ name: 'min_qty', type: 'numeric', precision: 10, scale: 2 })
  minQty: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  cost: number;

  @Column({ name: 'sale_price', type: 'numeric', precision: 10, scale: 2 })
  salePrice: number;

  @Column({ name: 'profit_margin', type: 'numeric', precision: 10, scale: 2 })
  profitMargin: number;

  @Column({ name: 'has_recipe', type: 'boolean', default: false })
  hasRecipe: boolean;

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
