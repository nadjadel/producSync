import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product_id: Types.ObjectId;

  @Prop()
  product_name: string;

  @Prop()
  product_reference: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  unit_price: number;

  @Prop({ default: 0 })
  total: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  order_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer_id: Types.ObjectId;

  @Prop({ required: true })
  customer_name: string;

  @Prop({
    enum: ['draft', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop()
  order_date: Date;

  @Prop()
  delivery_date_requested: Date;

  @Prop({ type: [OrderItem], default: [] })
  items: OrderItem[];

  @Prop({ default: 0 })
  total_ht: number;

  @Prop({ default: 20 })
  vat_rate: number;

  @Prop({ default: 0 })
  total_vat: number;

  @Prop({ default: 0 })
  total_ttc: number;

  @Prop()
  delivery_address: string;

  @Prop()
  notes: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
