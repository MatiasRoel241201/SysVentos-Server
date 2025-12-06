import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductSupply } from '../../product-supplies/entities/product-supply.entity';
import { EventSupplyInventory } from '../../inventories/entities/event-supply-inventory.entity';
import { SupplyUnit } from '../enums/supply-unit.enum';

@Entity({ name: 'supplies' })
export class Supply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: SupplyUnit,
    default: SupplyUnit.UNIDAD,
  })
  unit: SupplyUnit;



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

  @OneToMany(() => ProductSupply, (productSupply) => productSupply.supply)
  productSupplies: ProductSupply[];

  @OneToMany(
    () => EventSupplyInventory,
    (eventSupply) => eventSupply.supply,
  )
  eventSupplyInventories: EventSupplyInventory[];
}
