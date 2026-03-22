import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ManufacturingOrderDocument = ManufacturingOrder & Document;

@Schema({ timestamps: true })
export class ManufacturingOrder {
  @Prop({ required: true, unique: true })
  order_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  customer_order_id: Types.ObjectId;

  @Prop()
  customer_order_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product_id: Types.ObjectId;

  @Prop({ required: true })
  product_name: string;

  @Prop({ required: true })
  quantity_planned: number;

  @Prop({ default: 0 })
  quantity_produced: number;

  @Prop({
    enum: ['draft', 'planned', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop({
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: string;

  @Prop({ type: Types.ObjectId, ref: 'Workstation' })
  workstation_id: Types.ObjectId;

  @Prop()
  workstation_name: string;

  @Prop()
  planned_start: Date;

  @Prop()
  planned_end: Date;

  @Prop()
  actual_start: Date;

  @Prop()
  actual_end: Date;

  @Prop()
  notes: string;

  @Prop({ default: false })
  ready_for_delivery: boolean;

  @Prop({ default: false })
  delivered: boolean;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryNote' })
  delivery_note_id: Types.ObjectId;

  @Prop({ default: false })
  is_subcontracted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Supplier' })
  supplier_id: Types.ObjectId;

  @Prop()
  supplier_name: string;

  @Prop()
  subcontract_number: string;

  @Prop()
  subcontract_sent_date: Date;

  @Prop()
  subcontract_expected_date: Date;

  @Prop({ default: 0 })
  subcontract_unit_price: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ManufacturingOrderSchema = SchemaFactory.createForClass(ManufacturingOrder);
