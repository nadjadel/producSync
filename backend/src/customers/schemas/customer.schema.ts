import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  company_name: string;

  @Prop()
  siret: string;

  @Prop()
  vat_number: string;

  @Prop()
  contact_name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  postal_code: string;

  @Prop()
  city: string;

  @Prop({ default: 'France' })
  country: string;

  @Prop({ 
    enum: ['30_days', '45_days', '60_days', 'cash', 'end_of_month'], 
    default: '30_days' 
  })
  payment_terms: string;

  @Prop({ 
    enum: ['active', 'inactive', 'prospect'], 
    default: 'active' 
  })
  status: string;

  @Prop()
  notes: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
