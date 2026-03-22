import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true })
  invoice_number: string;

  @Prop({ required: true })
  invoice_date: Date;

  @Prop({ required: true })
  customer_id: string;

  @Prop({ required: true })
  customer_name: string;

  @Prop()
  customer_address: string;

  @Prop()
  customer_siret: string;

  @Prop()
  customer_vat_number: string;

  @Prop({
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop()
  payment_terms: string;

  @Prop()
  due_date: Date;

  @Prop([
    {
      delivery_note_id: { type: MongooseSchema.Types.ObjectId, ref: 'DeliveryNote' },
      delivery_number: String,
      delivery_date: Date,
    },
  ])
  delivery_notes: Array<{
    delivery_note_id: MongooseSchema.Types.ObjectId;
    delivery_number: string;
    delivery_date: Date;
  }>;

  @Prop([
    {
      description: String,
      quantity: Number,
      unit_price: Number,
      total_ht: Number,
      vat_rate: Number,
    },
  ])
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_ht: number;
    vat_rate: number;
  }>;

  @Prop({ default: 0 })
  total_ht: number;

  @Prop({ default: 0 })
  total_vat: number;

  @Prop({ default: 0 })
  total_ttc: number;

  @Prop()
  notes: string;

  @Prop()
  payment_date: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
