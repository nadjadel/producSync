import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuoteDocument = Quote & Document;

@Schema()
export class QuoteItem {
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
export class Quote {
  @Prop({ required: true, unique: true })
  quote_number: string;

  @Prop()
  quote_date: Date;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer_id: Types.ObjectId;

  @Prop({ required: true })
  customer_name: string;

  @Prop({
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  })
  status: string;

  @Prop()
  valid_until: Date;

  @Prop({ type: [QuoteItem], default: [] })
  items: QuoteItem[];

  @Prop({ default: 0 })
  total_ht: number;

  @Prop({ default: 20 })
  vat_rate: number;

  @Prop({ default: 0 })
  total_vat: number;

  @Prop({ default: 0 })
  total_ttc: number;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
