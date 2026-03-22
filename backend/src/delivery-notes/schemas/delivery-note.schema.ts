import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliveryNoteDocument = DeliveryNote & Document;

@Schema()
export class DeliveryNoteItem {
  @Prop({ type: Types.ObjectId, ref: 'ManufacturingOrder' })
  manufacturing_order_id: Types.ObjectId;

  @Prop()
  order_number: string;

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
export class DeliveryNote {
  @Prop({ required: true, unique: true })
  delivery_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer_id: Types.ObjectId;

  @Prop({ required: true })
  customer_name: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id: Types.ObjectId;

  @Prop()
  order_number: string;

  @Prop()
  delivery_date: Date;

  @Prop({
    enum: ['draft', 'sent', 'invoiced'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: [DeliveryNoteItem], default: [] })
  items: DeliveryNoteItem[];

  @Prop()
  delivery_address: string;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  invoice_id: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DeliveryNoteSchema = SchemaFactory.createForClass(DeliveryNote);
