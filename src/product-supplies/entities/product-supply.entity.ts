import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity({ name: 'product_supplies' })
export class ProductSupply {
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @PrimaryColumn({ name: 'supply_id', type: 'uuid' })
  supplyId: string;

  @ManyToOne(() => Product, (product) => product.productSupplies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Supply, (supply) => supply.productSupplies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supply_id' })
  supply: Supply;

  @Column({
    name: 'qty_per_unit',
    type: 'numeric',
    precision: 10,
    scale: 3,
  })
  qtyPerUnit: number;
}
