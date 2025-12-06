import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventInventory } from '../../inventories/entities/event-inventory.entity';
import { ProductSupply } from '../../product-supplies/entities/product-supply.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'has_recipe', type: 'boolean', default: false })
  hasRecipe: boolean;

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

  @OneToMany(() => EventInventory, (eventInventory) => eventInventory.product)
  eventInventories: EventInventory[];

  @OneToMany(() => ProductSupply, (productSupply) => productSupply.product)
  productSupplies: ProductSupply[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];
}
