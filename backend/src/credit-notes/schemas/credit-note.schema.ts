import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CreditNoteDocument = CreditNote & Document;

@Schema({ timestamps: true })
export class CreditNote {
  @Prop({ required: true, unique: true })
  credit_note_number: string; // AV+XXXXXXXX

  @Prop({ required: true, ref: 'Invoice' })
  invoice_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, ref: 'Customer' })
  customer_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  customer_name: string;

  @Prop({ required: true })
  credit_note_date: Date;

  @Prop({ required: true })
  reason: string; // 'return', 'error', 'discount', 'other'

  @Prop()
  reason_details?: string;

  @Prop({ required: true, default: 0 })
  total_amount: number;

  @Prop({ required: true, default: 0 })
  vat_amount: number;

  @Prop({ required: true, default: 0 })
  total_with_vat: number;

  @Prop({
    type: [{
      product_id: { type: MongooseSchema.Types.ObjectId, ref: 'Product' },
      product_code: String,
      product_name: String,
      quantity: Number,
      unit_price: Number,
      total: Number,
      vat_rate: Number,
      vat_amount: Number,
      reason: String,
    }],
    required: true,
  })
  items: Array<{
    product_id: MongooseSchema.Types.ObjectId;
    product_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
    vat_rate: number;
    vat_amount: number;
    reason: string;
  }>;

  @Prop({
    enum: ['draft', 'issued', 'applied', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop({ ref: 'Invoice' })
  applied_to_invoice_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  applied_date?: Date;

  @Prop()
  cancellation_reason?: string;

  @Prop()
  cancelled_date?: Date;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  created_by: string;

  @Prop()
  approved_by?: string;

  @Prop()
  approval_date?: Date;

  @Prop({ default: false })
  is_fully_applied: boolean;

  @Prop({ default: 0 })
  remaining_amount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CreditNoteSchema = SchemaFactory.createForClass(CreditNote);
